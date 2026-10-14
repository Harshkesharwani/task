# Event Scheduling & Project Invoice Management Engine

**Candidate:** Harsh Kesharwani  
**Technical Interview Assignment**  
**Tech Stack:** Python (Django REST Framework - DRF), React.js (Vite + Tailwind CSS), SQLite, Django Test Suite  
*(Simple, clean architecture — No Docker required)*

🌐 **Live GitHub Pages URL:** [https://harshkesharwani.github.io/task/](https://harshkesharwani.github.io/task/)  
📦 **GitHub Repository:** [https://github.com/Harshkesharwani/task](https://github.com/Harshkesharwani/task)

---

## 📌 Overview

This project implements the complete full-stack web application specified in the assignment PDF:
- **Backend**: Built with **Django REST Framework (DRF)**. Normalizes event intervals to UTC for persistent storage, validates time overlaps using interval algebra, calculates recurring schedules (`DAILY`, `WEEKLY`), and provides optimized relational invoice queries.
- **Frontend**: Clean, responsive **React.js** dashboard featuring an interactive month calendar, dynamic category filters, multi-timezone switcher, and a searchable/filterable invoice data grid with real-time UI synchronization.
- **GitHub Pages Demo**: Features automatic client-side demo state fallback so the live site functions interactively with sample data even on static hosting without a local backend.

---

## 🗄️ Database Architecture (Exact PDF Schema)

| Model | Fields | Description |
|---|---|---|
| **User** | `id`, `full_name`, `email`, `role`, `time_zone`, `created_at` | Team members & managers |
| **ProjectEvent** | `id`, `title`, `start_time`, `end_time`, `is_recurring`, `time_zone`, `status`, `category`, `recurrence_pattern`, `recurrence_end_date` | Deliverables, meetings, and recurring schedules |
| **Invoice** | `id`, `event_id`, `invoice_number`, `amount`, `status (DRAFT/PAID/OVERDUE)`, `created_at` | Client billing records linked to events |
| **InvoiceItem** | `id`, `invoice_id`, `description`, `quantity`, `unit_price` | Itemized line items with auto-computed total |

---

## 🚀 Core REST APIs (Django REST Framework)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/events` | Create scheduled or recurring events with time zone conversion to UTC and overlap validation. |
| `GET` | `/api/events` | Retrieve events with date-range (`start_date`, `end_date`), `category`, and `time_zone` filters, including recurrence projection. |
| `POST` | `/api/invoices` | Generate billing invoice records linked to specific project events, auto-calculating total amount from itemized entries. |
| `GET` | `/api/invoices/search` | Searchable & filterable invoice query (by text search, payment status `DRAFT`/`PAID`/`OVERDUE`, and date range). |
| `PATCH` | `/api/invoices/<id>` | Quick status transition (`DRAFT` ↔ `PAID` ↔ `OVERDUE`). |

---

## 🧪 Automated DRF Test Suite (10/10 Passed)

```cmd
cd backend
python manage.py test api -v 2
```

```
test_create_event_overlap_rejected (api.tests.EventsAPITests) ... ok
test_create_event_with_timezone_normalization (api.tests.EventsAPITests) ... ok
test_get_events_filtered_by_category (api.tests.EventsAPITests) ... ok
test_create_invoice_and_calculate_amount (api.tests.InvoicesAPITests) ... ok
test_search_invoices_by_status_and_query (api.tests.InvoicesAPITests) ... ok
test_daily_recurrence_occurrences (api.tests.TimezoneAndRecurrenceTests) ... ok
test_intervals_overlap_detection (api.tests.TimezoneAndRecurrenceTests) ... ok
test_timezone_conversion_to_utc_from_est (api.tests.TimezoneAndRecurrenceTests) ... ok
test_timezone_conversion_to_utc_from_ist (api.tests.TimezoneAndRecurrenceTests) ... ok
test_weekly_recurrence_occurrences (api.tests.TimezoneAndRecurrenceTests) ... ok

----------------------------------------------------------------------
Ran 10 tests in 0.053s

OK
```

---

## 🏃 Local Execution (Windows)

Double-click `start_all.bat` or run:
```cmd
# Terminal 1 - DRF Backend:
cd backend
python manage.py runserver 8000

# Terminal 2 - React Frontend:
cd frontend
npm run dev
```
- Dashboard UI: `http://localhost:5173`
- DRF API Base: `http://localhost:8000/api/`
