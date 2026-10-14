from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from datetime import datetime, timedelta, timezone as py_timezone
import zoneinfo

from .models import User, ProjectEvent, Invoice, InvoiceItem
from .utils import to_utc, from_utc, check_intervals_overlap, generate_recurring_occurrences


class TimezoneAndRecurrenceTests(TestCase):
    def test_timezone_conversion_to_utc_from_ist(self):
        # 15:30 IST is 10:00 UTC
        local_iso = "2026-10-15T15:30:00"
        utc_dt = to_utc(local_iso, "Asia/Kolkata")
        self.assertEqual(utc_dt.hour, 10)
        self.assertEqual(utc_dt.minute, 0)

    def test_timezone_conversion_to_utc_from_est(self):
        # 10:00 EDT (UTC-4) is 14:00 UTC
        local_iso = "2026-10-15T10:00:00"
        utc_dt = to_utc(local_iso, "America/New_York")
        self.assertEqual(utc_dt.hour, 14)
        self.assertEqual(utc_dt.minute, 0)

    def test_intervals_overlap_detection(self):
        base_s = datetime(2026, 10, 15, 10, 0, tzinfo=zoneinfo.ZoneInfo("UTC"))
        base_e = datetime(2026, 10, 15, 12, 0, tzinfo=zoneinfo.ZoneInfo("UTC"))

        # Overlapping inside
        self.assertTrue(check_intervals_overlap(
            base_s, base_e,
            datetime(2026, 10, 15, 10, 30, tzinfo=zoneinfo.ZoneInfo("UTC")),
            datetime(2026, 10, 15, 11, 30, tzinfo=zoneinfo.ZoneInfo("UTC"))
        ))

        # Boundary touching (no overlap)
        self.assertFalse(check_intervals_overlap(
            base_s, base_e,
            datetime(2026, 10, 15, 12, 0, tzinfo=zoneinfo.ZoneInfo("UTC")),
            datetime(2026, 10, 15, 13, 0, tzinfo=zoneinfo.ZoneInfo("UTC"))
        ))

    def test_daily_recurrence_occurrences(self):
        start = datetime(2026, 10, 15, 10, 0, tzinfo=zoneinfo.ZoneInfo("UTC"))
        end = datetime(2026, 10, 15, 11, 0, tzinfo=zoneinfo.ZoneInfo("UTC"))
        rec_end = datetime(2026, 10, 19, 11, 0, tzinfo=zoneinfo.ZoneInfo("UTC"))

        occurrences = generate_recurring_occurrences(start, end, "DAILY", rec_end)
        self.assertEqual(len(occurrences), 5)

    def test_weekly_recurrence_occurrences(self):
        start = datetime(2026, 10, 15, 10, 0, tzinfo=zoneinfo.ZoneInfo("UTC"))
        end = datetime(2026, 10, 15, 11, 0, tzinfo=zoneinfo.ZoneInfo("UTC"))
        rec_end = datetime(2026, 11, 5, 11, 0, tzinfo=zoneinfo.ZoneInfo("UTC"))

        occurrences = generate_recurring_occurrences(start, end, "WEEKLY", rec_end)
        self.assertEqual(len(occurrences), 4)


class EventsAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_create_event_with_timezone_normalization(self):
        payload = {
            "title": "Client Review",
            "category": "MILESTONE",
            "start_time": "2026-10-20T10:00:00",
            "end_time": "2026-10-20T11:30:00",
            "time_zone": "Asia/Kolkata",
            "is_recurring": False
        }
        response = self.client.post("/api/events", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertEqual(data["title"], "Client Review")
        # 10:00 IST is 04:30 UTC
        self.assertIn("04:30:00", data["start_time"])

    def test_create_event_overlap_rejected(self):
        # Base event
        ev1 = {
            "title": "Event Alpha",
            "start_time": "2026-10-22T14:00:00",
            "end_time": "2026-10-22T16:00:00",
            "time_zone": "UTC"
        }
        res1 = self.client.post("/api/events", ev1, format="json")
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)

        # Overlapping event
        ev2 = {
            "title": "Event Beta Conflicting",
            "start_time": "2026-10-22T15:00:00",
            "end_time": "2026-10-22T17:00:00",
            "time_zone": "UTC"
        }
        res2 = self.client.post("/api/events", ev2, format="json")
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("overlap_conflict", res2.json())

    def test_get_events_filtered_by_category(self):
        self.client.post("/api/events", {
            "title": "Sprint Milestone",
            "category": "MILESTONE",
            "start_time": "2026-10-24T10:00:00",
            "end_time": "2026-10-24T11:00:00",
            "time_zone": "UTC"
        }, format="json")

        self.client.post("/api/events", {
            "title": "Weekly Meeting",
            "category": "MEETING",
            "start_time": "2026-10-25T10:00:00",
            "end_time": "2026-10-25T11:00:00",
            "time_zone": "UTC"
        }, format="json")

        res = self.client.get("/api/events?category=MILESTONE")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        items = res.json()
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["category"], "MILESTONE")


class InvoicesAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_create_invoice_and_calculate_amount(self):
        payload = {
            "status": "DRAFT",
            "items": [
                {"description": "Backend API Service", "quantity": 10.0, "unit_price": 100.0},
                {"description": "Frontend UI Component", "quantity": 5.0, "unit_price": 50.0}
            ]
        }
        response = self.client.post("/api/invoices", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertEqual(float(data["amount"]), 1250.00)
        self.assertEqual(len(data["items"]), 2)
        self.assertTrue(data["invoice_number"].startswith("INV-"))

    def test_search_invoices_by_status_and_query(self):
        # Create Invoice 1
        self.client.post("/api/invoices", {
            "invoice_number": "INV-TEST-001",
            "status": "PAID",
            "items": [{"description": "Cloud Architecture", "quantity": 1, "unit_price": 2000}]
        }, format="json")

        # Create Invoice 2
        self.client.post("/api/invoices", {
            "invoice_number": "INV-TEST-002",
            "status": "DRAFT",
            "items": [{"description": "Database Optimization", "quantity": 1, "unit_price": 1500}]
        }, format="json")

        # Search by status=PAID
        res_paid = self.client.get("/api/invoices/search?status=PAID")
        self.assertEqual(res_paid.status_code, status.HTTP_200_OK)
        self.assertEqual(res_paid.json()["total"], 1)
        self.assertEqual(res_paid.json()["items"][0]["status"], "PAID")

        # Search by text query "Optimization"
        res_text = self.client.get("/api/invoices/search?search=Optimization")
        self.assertEqual(res_text.status_code, status.HTTP_200_OK)
        self.assertEqual(res_text.json()["total"], 1)
        self.assertEqual(res_text.json()["items"][0]["invoice_number"], "INV-TEST-002")
