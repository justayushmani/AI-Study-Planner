from datetime import date, timedelta
from typing import List, Dict, Tuple
from .models import AvailabilityInput, PlanConstraints

DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

class ConstraintManager:
    @staticmethod
    def get_calendar_days(start_date: date, deadline: date) -> List[date]:
        """Returns ordered list of calendar dates from start_date up to deadline."""
        days = []
        curr = start_date
        while curr <= deadline:
            days.append(curr)
            curr += timedelta(days=1)
        return days

    @staticmethod
    def calculate_available_minutes_per_day(
        calendar_days: List[date],
        availability: AvailabilityInput
    ) -> Dict[date, int]:
        """
        Maps each calendar day to user-allowed available study minutes.
        Caps at availability.max_daily_minutes_cap.
        """
        daily_capacity = {}
        for d in calendar_days:
            day_name = DAY_NAMES[d.weekday()]
            hours = availability.weekly_hours.get(day_name, 0.0)
            minutes = min(int(hours * 60), availability.max_daily_minutes_cap)
            daily_capacity[d] = minutes
        return daily_capacity

    @staticmethod
    def partition_buffer_days(
        calendar_days: List[date],
        buffer_days_count: int,
        daily_capacity: Dict[date, int]
    ) -> Tuple[List[date], List[date]]:
        """
        Partitions dates into regular study days and trailing buffer days.
        Only counts days where capacity > 0.
        """
        active_days = [d for d in calendar_days if daily_capacity.get(d, 0) > 0]
        if buffer_days_count <= 0 or len(active_days) <= buffer_days_count:
            return active_days, []
        
        # Reserve the last `buffer_days_count` active days as buffer
        study_days = active_days[:-buffer_days_count]
        buffer_days = active_days[-buffer_days_count:]
        return study_days, buffer_days

    @staticmethod
    def get_start_time_offset(preferred_time: str, custom_time: str = "18:00") -> Tuple[int, int]:
        """Returns default (hour, minute) for preferred time block."""
        if preferred_time == "Morning":
            return (8, 0)
        elif preferred_time == "Afternoon":
            return (14, 0)
        elif preferred_time == "Evening":
            return (18, 0)
        else:
            try:
                parts = custom_time.split(":")
                return (int(parts[0]), int(parts[1]))
            except Exception:
                return (18, 0)
