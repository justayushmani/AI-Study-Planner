import uuid
from datetime import date, timedelta
from typing import List, Dict, Set, Tuple
from .models import (
    TopicInput, AvailabilityInput, PlanConstraints,
    ScheduledTask, ScheduleResult, RescheduleRequest
)
from .planner import DeterministicPlanner

class IntelligentRescheduler:
    """
    Intelligently recalculates the remaining study plan after missed days or schedule disruption.
    Does NOT simply shift tasks by 1 day; intelligently redistributes workload
    across remaining days while protecting the deadline and buffer.
    """

    @classmethod
    def reschedule(cls, req: RescheduleRequest) -> Tuple[ScheduleResult, Dict]:
        # 1. Separate completed vs missed vs future tasks
        completed_tasks = [t for t in req.existing_tasks if t.status == "Completed" or t.id in req.completed_task_ids]
        completed_topic_ids: Set[str] = {t.topic_id for t in completed_tasks}

        # Missed tasks: tasks on or before today that are not completed
        missed_tasks = [
            t for t in req.existing_tasks
            if (t.scheduled_date <= req.today.isoformat() or t.id in req.missed_task_ids)
            and t.status != "Completed"
            and t.id not in req.completed_task_ids
        ]

        missed_topic_minutes = sum(t.duration_minutes for t in missed_tasks)

        # 2. Re-compute remaining topics needed
        # Any topic that still has uncompleted work
        completed_minutes_per_topic: Dict[str, int] = {}
        for ct in completed_tasks:
            completed_minutes_per_topic[ct.topic_id] = (
                completed_minutes_per_topic.get(ct.topic_id, 0) + ct.duration_minutes
            )

        remaining_topics: List[TopicInput] = []
        for t in req.all_topics:
            done_mins = completed_minutes_per_topic.get(t.id, 0)
            remaining_mins = max(0, t.base_estimated_minutes - done_mins)
            if remaining_mins > 0:
                # Update topic base minutes to only remaining work
                topic_copy = t.model_copy(update={"base_estimated_minutes": remaining_mins})
                remaining_topics.append(topic_copy)

        # 3. Create new plan starting from tomorrow (or today if study hours remain)
        start_date = req.today + timedelta(days=1)
        if start_date > req.deadline:
            start_date = req.deadline

        availability = AvailabilityInput(
            weekly_hours=req.weekly_hours,
            preferred_study_time=req.preferred_study_time
        )

        constraints = PlanConstraints(
            start_date=start_date,
            deadline=req.deadline,
            buffer_days=req.buffer_days
        )

        # Re-run planner for remaining syllabus
        planner = DeterministicPlanner(remaining_topics, availability, constraints)
        new_result = planner.generate_schedule()

        # Combine completed past tasks with newly rescheduled future tasks
        combined_tasks = completed_tasks + new_result.tasks
        combined_tasks.sort(key=lambda x: (x.scheduled_date, x.start_time))

        diff_summary = {
            "missed_tasks_count": len(missed_tasks),
            "redistributed_minutes": missed_topic_minutes,
            "deadline_maintained": new_result.is_feasible,
            "new_future_task_count": len(new_result.tasks),
            "buffer_days_preserved": len(new_result.buffer_dates),
            "missed_topics": list({t.topic_title for t in missed_tasks})
        }

        new_result.tasks = combined_tasks
        return new_result, diff_summary
