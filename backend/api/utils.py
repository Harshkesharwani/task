from datetime import datetime, timedelta, timezone as py_timezone
import zoneinfo
from typing import List, Tuple, Optional, Dict, Any
from dateutil import parser
from django.utils import timezone


def to_utc(dt_input, source_tz_str: str = "UTC") -> datetime:
    """
    Parses a datetime (or ISO string) and converts it to aware UTC datetime
    for database persistence.
    """
    if isinstance(dt_input, str):
        dt = parser.parse(dt_input)
    else:
        dt = dt_input

    try:
        tz = zoneinfo.ZoneInfo(source_tz_str or "UTC")
    except Exception:
        tz = zoneinfo.ZoneInfo("UTC")

    if timezone.is_naive(dt):
        # Attach source timezone
        dt = dt.replace(tzinfo=tz)

    # Convert to UTC
    return dt.astimezone(zoneinfo.ZoneInfo("UTC"))


def from_utc(dt_input: datetime, target_tz_str: str = "UTC") -> datetime:
    """Converts a UTC datetime into aware target timezone."""
    try:
        tz = zoneinfo.ZoneInfo(target_tz_str or "UTC")
    except Exception:
        tz = zoneinfo.ZoneInfo("UTC")

    if timezone.is_naive(dt_input):
        dt_input = dt_input.replace(tzinfo=zoneinfo.ZoneInfo("UTC"))

    return dt_input.astimezone(tz)


def generate_recurring_occurrences(
    start_utc: datetime,
    end_utc: datetime,
    pattern: str,
    recurrence_end_utc: Optional[datetime],
    window_start: Optional[datetime] = None,
    window_end: Optional[datetime] = None,
    max_count: int = 52
) -> List[Tuple[datetime, datetime]]:
    """
    Calculates recurring intervals (DAILY or WEEKLY) up to recurrence_end_utc.
    """
    duration = end_utc - start_utc
    occurrences = []

    current_start = start_utc
    current_end = end_utc
    step = timedelta(days=1) if pattern == "DAILY" else timedelta(weeks=1)

    effective_end = recurrence_end_utc or (start_utc + timedelta(days=180))
    count = 0

    while current_start <= effective_end and count < max_count:
        in_window = True
        if window_start and current_end < window_start:
            in_window = False
        if window_end and current_start > window_end:
            in_window = False

        if in_window:
            occurrences.append((current_start, current_end))

        current_start += step
        current_end = current_start + duration
        count += 1

    return occurrences


def check_intervals_overlap(s1: datetime, e1: datetime, s2: datetime, e2: datetime) -> bool:
    """Returns True if [s1, e1) and [s2, e2) overlap."""
    return s1 < e2 and e1 > s2


def validate_event_overlaps(
    new_intervals: List[Tuple[datetime, datetime]],
    exclude_event_id: Optional[int] = None
) -> Optional[Dict[str, Any]]:
    """
    Validates whether any interval in new_intervals overlaps with existing active events.
    Checks both single and recurring events.
    Returns conflicting event details if overlap detected, else None.
    """
    from .models import ProjectEvent

    existing_events = ProjectEvent.objects.filter(
        status__in=['SCHEDULED', 'IN_PROGRESS']
    )
    if exclude_event_id:
        existing_events = existing_events.exclude(id=exclude_event_id)

    min_start = min(s for s, _ in new_intervals)
    max_end = max(e for _, e in new_intervals)

    for event in existing_events:
        if not event.is_recurring:
            for new_s, new_e in new_intervals:
                if check_intervals_overlap(new_s, new_e, event.start_time, event.end_time):
                    return {
                        "conflicting_event_id": event.id,
                        "conflicting_title": event.title,
                        "conflict_start": event.start_time.isoformat(),
                        "conflict_end": event.end_time.isoformat(),
                        "message": f"Time overlap detected with existing event '{event.title}' (ID: {event.id})"
                    }
        else:
            occurrences = generate_recurring_occurrences(
                start_utc=event.start_time,
                end_utc=event.end_time,
                pattern=event.recurrence_pattern,
                recurrence_end_utc=event.recurrence_end_date,
                window_start=min_start,
                window_end=max_end
            )
            for ex_s, ex_e in occurrences:
                for new_s, new_e in new_intervals:
                    if check_intervals_overlap(new_s, new_e, ex_s, ex_e):
                        return {
                            "conflicting_event_id": event.id,
                            "conflicting_title": event.title,
                            "conflict_start": ex_s.isoformat(),
                            "conflict_end": ex_e.isoformat(),
                            "message": f"Time overlap detected with recurring occurrence of '{event.title}' (ID: {event.id})"
                        }

    return None
