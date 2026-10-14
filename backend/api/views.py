from datetime import datetime, timedelta, timezone as py_timezone
from django.db.models import Q, Sum
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view

from .models import User, ProjectEvent, Invoice, InvoiceItem
from .serializers import UserSerializer, ProjectEventSerializer, InvoiceSerializer, InvoiceItemSerializer
from .utils import to_utc, from_utc, generate_recurring_occurrences


# =======================================================
# 1. Events APIs: POST /api/events and GET /api/events
# =======================================================
class EventListCreateView(APIView):
    """
    • POST /api/events: Create scheduled/recurring events with time zone conversion and validation.
    • GET /api/events: Retrieve events with date-range and category filters.
    """

    def get(self, request):
        queryset = ProjectEvent.objects.all()

        category = request.query_params.get('category')
        if category and category.upper() != 'ALL':
            queryset = queryset.filter(category=category.upper())

        start_date_param = request.query_params.get('start_date')
        end_date_param = request.query_params.get('end_date')
        target_tz = request.query_params.get('time_zone', 'UTC')
        expand_recurring = request.query_params.get('expand_recurring', 'true').lower() == 'true'

        utc_start = to_utc(start_date_param, target_tz) if start_date_param else None
        utc_end = to_utc(end_date_param, target_tz) if end_date_param else None

        events = list(queryset)
        response_data = []

        for ev in events:
            if not ev.is_recurring or not expand_recurring:
                if utc_start and ev.end_time < utc_start:
                    continue
                if utc_end and ev.start_time > utc_end:
                    continue

                serializer = ProjectEventSerializer(ev, context={'target_tz': target_tz})
                item = serializer.data
                item['is_recurrence_instance'] = False
                response_data.append(item)
            else:
                # Expand recurring occurrences for interactive calendar
                occurrences = generate_recurring_occurrences(
                    start_utc=ev.start_time,
                    end_utc=ev.end_time,
                    pattern=ev.recurrence_pattern,
                    recurrence_end_utc=ev.recurrence_end_date,
                    window_start=utc_start,
                    window_end=utc_end
                )

                for idx, (occ_s, occ_e) in enumerate(occurrences):
                    response_data.append({
                        "id": ev.id * 10000 + idx if idx > 0 else ev.id,
                        "title": f"{ev.title} (Recurring)" if idx > 0 else ev.title,
                        "category": ev.category,
                        "start_time": occ_s.isoformat(),
                        "end_time": occ_e.isoformat(),
                        "is_recurring": True,
                        "recurrence_pattern": ev.recurrence_pattern,
                        "recurrence_end_date": ev.recurrence_end_date.isoformat() if ev.recurrence_end_date else None,
                        "time_zone": ev.time_zone,
                        "status": ev.status,
                        "created_at": ev.created_at.isoformat(),
                        "local_start_time": from_utc(occ_s, target_tz).isoformat(),
                        "local_end_time": from_utc(occ_e, target_tz).isoformat(),
                        "is_recurrence_instance": (idx > 0),
                        "parent_event_id": ev.id,
                        "invoice_count": ev.invoices.count(),
                    })

        response_data.sort(key=lambda x: x['start_time'])
        return Response(response_data)

    def post(self, request):
        target_tz = request.data.get('time_zone', 'UTC')
        serializer = ProjectEventSerializer(data=request.data, context={'target_tz': target_tz})
        if serializer.is_valid():
            event = serializer.save()
            return Response(ProjectEventSerializer(event, context={'target_tz': target_tz}).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EventDetailView(APIView):
    def get(self, request, pk):
        try:
            event = ProjectEvent.objects.get(pk=pk)
        except ProjectEvent.DoesNotExist:
            return Response({"detail": "Event not found."}, status=status.HTTP_404_NOT_FOUND)

        target_tz = request.query_params.get('time_zone', event.time_zone)
        serializer = ProjectEventSerializer(event, context={'target_tz': target_tz})
        return Response(serializer.data)

    def delete(self, request, pk):
        try:
            event = ProjectEvent.objects.get(pk=pk)
            event.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ProjectEvent.DoesNotExist:
            return Response({"detail": "Event not found."}, status=status.HTTP_404_NOT_FOUND)


# =======================================================
# 2. Invoices APIs: POST /api/invoices and GET /api/invoices/search
# =======================================================
class InvoiceListCreateView(APIView):
    """
    • POST /api/invoices: Generate billing invoice records linked to specific project events.
    """
    def post(self, request):
        serializer = InvoiceSerializer(data=request.data)
        if serializer.is_valid():
            invoice = serializer.save()
            return Response(InvoiceSerializer(invoice).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class InvoiceSearchView(APIView):
    """
    • GET /api/invoices/search: Searchable and filterable invoice data retrieval.
    """
    def get(self, request):
        queryset = Invoice.objects.select_related('event').prefetch_related('items').distinct()

        # Text search: invoice number, event title, item description
        search_query = request.query_params.get('search')
        if search_query:
            query_pattern = search_query.strip()
            queryset = queryset.filter(
                Q(invoice_number__icontains=query_pattern) |
                Q(event__title__icontains=query_pattern) |
                Q(items__description__icontains=query_pattern)
            )

        # Status filter: DRAFT, PAID, OVERDUE
        status_filter = request.query_params.get('status')
        if status_filter and status_filter.upper() != 'ALL':
            queryset = queryset.filter(status=status_filter.upper())

        # Date range filter
        start_date = request.query_params.get('start_date')
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)

        end_date = request.query_params.get('end_date')
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date)

        total_count = queryset.count()

        # Aggregate financial summaries
        all_invoices = list(queryset)
        total_amount = sum(inv.amount for inv in all_invoices)
        paid_amount = sum(inv.amount for inv in all_invoices if inv.status == 'PAID')
        draft_amount = sum(inv.amount for inv in all_invoices if inv.status == 'DRAFT')
        overdue_amount = sum(inv.amount for inv in all_invoices if inv.status == 'OVERDUE')

        # Pagination
        try:
            page = max(1, int(request.query_params.get('page', 1)))
            page_size = max(1, min(100, int(request.query_params.get('page_size', 20))))
        except ValueError:
            page = 1
            page_size = 20

        offset = (page - 1) * page_size
        paginated_items = queryset[offset:offset + page_size]
        total_pages = (total_count + page_size - 1) // page_size if total_count > 0 else 1

        serializer = InvoiceSerializer(paginated_items, many=True)

        return Response({
            "items": serializer.data,
            "total": total_count,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
            "summary": {
                "total_count": total_count,
                "total_amount": float(total_amount),
                "paid_amount": float(paid_amount),
                "draft_amount": float(draft_amount),
                "overdue_amount": float(overdue_amount)
            }
        })


class InvoiceDetailView(APIView):
    def get(self, request, pk):
        try:
            inv = Invoice.objects.get(pk=pk)
            return Response(InvoiceSerializer(inv).data)
        except Invoice.DoesNotExist:
            return Response({"detail": "Invoice not found."}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, pk):
        try:
            inv = Invoice.objects.get(pk=pk)
        except Invoice.DoesNotExist:
            return Response({"detail": "Invoice not found."}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        if new_status:
            inv.status = new_status.upper()
            inv.save()
        return Response(InvoiceSerializer(inv).data)

    def delete(self, request, pk):
        try:
            inv = Invoice.objects.get(pk=pk)
            inv.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Invoice.DoesNotExist:
            return Response({"detail": "Invoice not found."}, status=status.HTTP_404_NOT_FOUND)


# =======================================================
# 3. Simple Dashboard Stats & Seeder
# =======================================================
@api_view(['GET'])
def dashboard_stats(request):
    events_count = ProjectEvent.objects.count()
    completed_events = ProjectEvent.objects.filter(status='COMPLETED').count()
    upcoming_events = ProjectEvent.objects.filter(status='SCHEDULED').count()

    invoices = Invoice.objects.all()
    total_invoices = invoices.count()
    paid_invoices = invoices.filter(status='PAID').count()
    overdue_invoices = invoices.filter(status='OVERDUE').count()
    draft_invoices = invoices.filter(status='DRAFT').count()

    total_revenue = sum(inv.amount for inv in invoices)
    paid_revenue = sum(inv.amount for inv in invoices if inv.status == 'PAID')
    pending_revenue = sum(inv.amount for inv in invoices if inv.status in ['DRAFT', 'OVERDUE'])

    return Response({
        "total_events": events_count,
        "completed_events": completed_events,
        "upcoming_events": upcoming_events,
        "total_invoices": total_invoices,
        "paid_invoices": paid_invoices,
        "overdue_invoices": overdue_invoices,
        "draft_invoices": draft_invoices,
        "total_revenue": float(total_revenue),
        "paid_revenue": float(paid_revenue),
        "pending_revenue": float(pending_revenue),
    })


@api_view(['POST'])
def seed_data(request):
    if ProjectEvent.objects.count() > 0:
        return Response({"message": "Database already initialized with data.", "seeded": False})

    user, _ = User.objects.get_or_create(
        email="harsh.kesharwani@example.io",
        defaults={
            "full_name": "Harsh Kesharwani",
            "role": "MANAGER",
            "time_zone": "Asia/Kolkata"
        }
    )

    now = datetime.now(py_timezone.utc)

    # Event 1: Milestone
    ev1 = ProjectEvent.objects.create(
        title="Sprint 1 Milestone Delivery",
        category="MILESTONE",
        start_time=now,
        end_time=now + timedelta(hours=2),
        is_recurring=False,
        time_zone="Asia/Kolkata",
        status="COMPLETED",
        user=user
    )

    # Event 2: Weekly review
    ev2 = ProjectEvent.objects.create(
        title="Weekly Project Architecture Review",
        category="MEETING",
        start_time=now + timedelta(days=2, hours=3),
        end_time=now + timedelta(days=2, hours=4),
        is_recurring=True,
        recurrence_pattern="WEEKLY",
        recurrence_end_date=now + timedelta(days=60),
        time_zone="UTC",
        status="SCHEDULED",
        user=user
    )

    # Invoice 1 linked to milestone
    inv1 = Invoice.objects.create(
        event=ev1,
        invoice_number="INV-2026-0001",
        amount=2500.00,
        status="PAID"
    )
    InvoiceItem.objects.create(invoice=inv1, description="Phase 1 Core Engine Delivery", quantity=1, unit_price=2500.00)

    # Invoice 2
    inv2 = Invoice.objects.create(
        event=None,
        invoice_number="INV-2026-0002",
        amount=1800.00,
        status="DRAFT"
    )
    InvoiceItem.objects.create(invoice=inv2, description="Frontend Dashboard Optimization", quantity=1, unit_price=1800.00)

    return Response({"message": "Database seeded successfully with demo records.", "seeded": True})
