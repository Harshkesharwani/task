from rest_framework import serializers
from decimal import Decimal
from datetime import datetime, timezone as py_timezone
from django.utils import timezone
from .models import User, ProjectEvent, Invoice, InvoiceItem
from .utils import to_utc, from_utc, generate_recurring_occurrences, validate_event_overlaps


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'full_name', 'email', 'role', 'time_zone', 'created_at']


class InvoiceItemSerializer(serializers.ModelSerializer):
    total_price = serializers.ReadOnlyField()

    class Meta:
        model = InvoiceItem
        fields = ['id', 'description', 'quantity', 'unit_price', 'total_price']


class InvoiceSerializer(serializers.ModelSerializer):
    event = serializers.PrimaryKeyRelatedField(
        queryset=ProjectEvent.objects.all(),
        required=False,
        allow_null=True
    )
    invoice_number = serializers.CharField(required=False, allow_blank=True)
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    items = InvoiceItemSerializer(many=True, required=False)
    event_title = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = [
            'id', 'event', 'event_title', 'invoice_number',
            'amount', 'status', 'created_at', 'items'
        ]
        read_only_fields = ['created_at']

    def get_event_title(self, obj):
        return obj.event.title if obj.event else None

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        
        # Auto-calculate amount if items are present
        if items_data:
            total = sum(Decimal(str(item.get('quantity', 1))) * Decimal(str(item.get('unit_price', 0))) for item in items_data)
            validated_data['amount'] = total
        elif 'amount' not in validated_data:
            validated_data['amount'] = Decimal('0.00')

        # Auto-generate invoice number if missing
        if not validated_data.get('invoice_number'):
            year = datetime.now(py_timezone.utc).year
            count = Invoice.objects.count() + 1
            validated_data['invoice_number'] = f"INV-{year}-{count:04d}"

        invoice = Invoice.objects.create(**validated_data)

        for item_data in items_data:
            InvoiceItem.objects.create(invoice=invoice, **item_data)

        return invoice


class ProjectEventSerializer(serializers.ModelSerializer):
    local_start_time = serializers.SerializerMethodField()
    local_end_time = serializers.SerializerMethodField()
    invoice_count = serializers.SerializerMethodField()

    class Meta:
        model = ProjectEvent
        fields = [
            'id', 'title', 'category', 'start_time', 'end_time',
            'is_recurring', 'recurrence_pattern', 'recurrence_end_date',
            'time_zone', 'status', 'user', 'created_at',
            'local_start_time', 'local_end_time', 'invoice_count'
        ]
        read_only_fields = ['created_at']

    def get_local_start_time(self, obj):
        target_tz = self.context.get('target_tz', obj.time_zone or 'UTC')
        return from_utc(obj.start_time, target_tz).isoformat()

    def get_local_end_time(self, obj):
        target_tz = self.context.get('target_tz', obj.time_zone or 'UTC')
        return from_utc(obj.end_time, target_tz).isoformat()

    def get_invoice_count(self, obj):
        return obj.invoices.count()

    def validate(self, data):
        # Extract original input strings to preserve source timezone intention before DRF default UTC conversion
        source_tz = data.get('time_zone', getattr(self.instance, 'time_zone', 'UTC'))
        is_rec = data.get('is_recurring', getattr(self.instance, 'is_recurring', False))
        rec_pat = data.get('recurrence_pattern', getattr(self.instance, 'recurrence_pattern', 'NONE'))

        raw_start = self.initial_data.get('start_time') if hasattr(self, 'initial_data') else None
        raw_end = self.initial_data.get('end_time') if hasattr(self, 'initial_data') else None
        raw_rec_end = self.initial_data.get('recurrence_end_date') if hasattr(self, 'initial_data') else None

        start_raw = raw_start or data.get('start_time')
        end_raw = raw_end or data.get('end_time')
        rec_end_raw = raw_rec_end or data.get('recurrence_end_date')

        if not start_raw or not end_raw:
            raise serializers.ValidationError("start_time and end_time are required.")

        # Convert to UTC
        start_utc = to_utc(start_raw, source_tz)
        end_utc = to_utc(end_raw, source_tz)

        if end_utc <= start_utc:
            raise serializers.ValidationError({"end_time": "end_time must be strictly after start_time."})

        rec_end_utc = None
        if is_rec and rec_end_raw:
            rec_end_utc = to_utc(rec_end_raw, source_tz)
            if rec_end_utc <= end_utc:
                raise serializers.ValidationError({"recurrence_end_date": "recurrence_end_date must be after initial end_time."})

        # Save back UTC-normalized values
        data['start_time'] = start_utc
        data['end_time'] = end_utc
        if rec_end_utc:
            data['recurrence_end_date'] = rec_end_utc

        # Overlap validation
        if is_rec:
            new_intervals = generate_recurring_occurrences(
                start_utc=start_utc,
                end_utc=end_utc,
                pattern=rec_pat,
                recurrence_end_utc=rec_end_utc
            )
        else:
            new_intervals = [(start_utc, end_utc)]

        exclude_id = self.instance.id if self.instance else None
        conflict = validate_event_overlaps(new_intervals, exclude_event_id=exclude_id)
        if conflict:
            raise serializers.ValidationError({"overlap_conflict": conflict})

        return data
