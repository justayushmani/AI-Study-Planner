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

        # 3. Apply adjusted daily hours increase if specified
        weekly_hours = dict(req.weekly_hours)
        if req.adjusted_daily_hours_increase > 0:
            for day_k in weekly_hours:
                if weekly_hours[day_k] > 0:
                    weekly_hours[day_k] += req.adjusted_daily_hours_increase

        # 4. Create new plan starting from tomorrow (or today if study hours remain)
        start_date = req.today + timedelta(days=1)
        if start_date > req.deadline:
            start_date = req.deadline

        availability = AvailabilityInput(
            weekly_hours=weekly_hours,
            preferred_study_time=req.preferred_study_time
        )

        constraints = PlanConstraints(
            start_date=start_date,
            deadline=req.deadline,
            buffer_days=req.buffer_days,
            blackout_dates=req.blackout_dates
        )

        # Re-run planner for remaining syllabus
        planner = DeterministicPlanner(remaining_topics, availability, constraints)
        new_result = planner.generate_schedule()

        # Combine completed past tasks with newly rescheduled future tasks
        combined_tasks = completed_tasks + new_result.tasks
        combined_tasks.sort(key=lambda x: (x.scheduled_date, x.start_time))

        # Proactive pace & feasibility calculations
        calendar_days = [start_date + timedelta(days=i) for i in range((req.deadline - start_date).days + 1)]
        blackout_set = set(req.blackout_dates or [])
        available_study_days = [d for d in calendar_days if d not in blackout_set and weekly_hours.get(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][d.weekday()], 0) > 0]
        
        total_remaining_minutes = sum(t.base_estimated_minutes for t in remaining_topics)
        active_days_count = max(1, len(available_study_days))
        suggested_daily_hrs = round((total_remaining_minutes / active_days_count) / 60.0, 1) if active_days_count > 0 else 0
        current_avg_daily_hrs = round(sum(weekly_hours.values()) / 7.0, 1)

        recommendations = []
        if len(blackout_set) > 0:
            recommendations.append(f"Excluded {len(blackout_set)} vacation/blackout day(s) from study schedule.")
        
        if not new_result.is_feasible or total_remaining_minutes > sum(weekly_hours.get(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][d.weekday()], 0) * 60 for d in available_study_days):
            additional_hrs_needed = max(0.25, round(suggested_daily_hrs - current_avg_daily_hrs, 1))
            recommendations.append(
                f"Pace alert: To comfortably complete your remaining syllabus by {req.deadline.strftime('%b %d, %Y')}, we recommend increasing daily study time by +{int(additional_hrs_needed * 60)} mins/day (target: {suggested_daily_hrs}h/day)."
            )
        else:
            recommendations.append(
                f"Pace optimal: Your current study pace of {current_avg_daily_hrs}h/day is sufficient to finish before the deadline with {len(new_result.buffer_dates)} buffer day(s) protected."
            )

        diff_summary = {
            "missed_tasks_count": len(missed_tasks),
            "redistributed_minutes": missed_topic_minutes,
            "deadline_maintained": new_result.is_feasible,
            "new_future_task_count": len(new_result.tasks),
            "buffer_days_preserved": len(new_result.buffer_dates),
            "vacation_days_applied": len(req.blackout_dates),
            "missed_topics": list({t.topic_title for t in missed_tasks}),
            "recommended_daily_hours": suggested_daily_hrs,
            "current_daily_hours": current_avg_daily_hrs,
            "recommendations": recommendations,
            "reason": req.reason or "Dynamic Schedule Redistribution"
        }

        new_result.suggestions = recommendations
        new_result.tasks = combined_tasks
        return new_result, diff_summary
