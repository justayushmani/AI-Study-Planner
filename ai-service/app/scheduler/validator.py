from typing import List, Dict, Tuple
from datetime import date
from .models import TopicInput, AvailabilityInput, PlanConstraints

class ScheduleValidator:
    @staticmethod
    def validate_plan_inputs(
        topics: List[TopicInput],
        availability: AvailabilityInput,
        constraints: PlanConstraints,
        daily_capacity: Dict[date, int],
        study_days: List[date]
    ) -> Tuple[bool, List[str]]:
        """
        Validates whether generating a schedule is feasible under provided constraints.
        Returns (is_feasible, warnings_or_errors).
        """
        errors = []

        if constraints.deadline <= constraints.start_date:
            errors.append("Target deadline must be after the start date.")
            return False, errors

        if not topics:
            errors.append("At least one topic is required to generate a study plan.")
            return False, errors

        total_study_capacity_minutes = sum(daily_capacity.get(d, 0) for d in study_days)
        total_topic_workload_minutes = sum(t.base_estimated_minutes for t in topics)

        if total_study_capacity_minutes == 0:
            errors.append("No available study hours found across the selected date range.")
            return False, errors

        if total_topic_workload_minutes > total_study_capacity_minutes:
            deficit_hours = round((total_topic_workload_minutes - total_study_capacity_minutes) / 60.0, 1)
            errors.append(
                f"Workload exceeds available time by {deficit_hours} hours. "
                f"Required: {total_topic_workload_minutes // 60}h, Available before buffer: {total_study_capacity_minutes // 60}h. "
                "Consider extending the deadline or increasing daily study hours."
            )
            return False, errors

        return True, []
