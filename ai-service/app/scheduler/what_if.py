from datetime import date, timedelta
from typing import Optional, Dict
from .models import WhatIfRequest, WhatIfResponse, AvailabilityInput, PlanConstraints
from .planner import DeterministicPlanner

class WhatIfSimulator:
    """
    In-memory sandboxed simulation engine for hypothetical schedule changes.
    Does not touch live data.
    """

    @classmethod
    def simulate(cls, req: WhatIfRequest) -> WhatIfResponse:
        deadline = req.hypothetical_deadline or req.current_deadline
        buffer_days = req.hypothetical_buffer_days if req.hypothetical_buffer_days is not None else 3
        
        # Calculate remaining workload from uncompleted tasks
        completed_task_ids = {t.id for t in req.existing_tasks if t.status == "Completed"}
        completed_mins_per_topic = {}
        for t in req.existing_tasks:
            if t.id in completed_task_ids:
                completed_mins_per_topic[t.topic_id] = (
                    completed_mins_per_topic.get(t.topic_id, 0) + t.duration_minutes
                )

        remaining_topics = []
        for top in req.all_topics:
            done = completed_mins_per_topic.get(top.id, 0)
            rem = max(0, top.base_estimated_minutes - done)
            if rem > 0:
                remaining_topics.append(top.model_copy(update={"base_estimated_minutes": rem}))

        weekly_hours = req.hypothetical_weekly_hours or {
            "Monday": 2.0, "Tuesday": 2.0, "Wednesday": 2.0,
            "Thursday": 2.0, "Friday": 2.0, "Saturday": 4.0, "Sunday": 4.0
        }

        availability = AvailabilityInput(weekly_hours=weekly_hours)
        constraints = PlanConstraints(
            start_date=req.today + timedelta(days=1),
            deadline=deadline,
            buffer_days=buffer_days
        )

        planner = DeterministicPlanner(remaining_topics, availability, constraints)
        sim_result = planner.generate_schedule()

        # Assess risk and trade-offs
        tradeoffs = []
        if sim_result.tasks:
            last_task_date = max(t.scheduled_date for t in sim_result.tasks)
        else:
            last_task_date = (req.today + timedelta(days=1)).isoformat()

        deadline_met = last_task_date <= deadline.isoformat() and sim_result.is_feasible
        total_mins = sum(t.duration_minutes for t in sim_result.tasks)
        total_days = max(1, sim_result.total_study_days)
        avg_daily_hours = round((total_mins / 60.0) / total_days, 1)

        if not deadline_met:
            risk = "HIGH RISK: The proposed constraints do not provide enough study capacity to finish all topics before your deadline."
            tradeoffs.append("You will need to either extend your deadline or increase study hours on free days.")
        elif len(sim_result.buffer_dates) == 0:
            risk = "MODERATE RISK: Deadline can be met, but zero buffer days remain for unexpected delays or sickness."
            tradeoffs.append("Any single missed study day will push your completion past the target deadline.")
        else:
            risk = "LOW RISK: The proposed schedule is comfortable and maintains a protective buffer window."
            tradeoffs.append(f"{len(sim_result.buffer_dates)} buffer days preserved for comprehensive final revision.")

        return WhatIfResponse(
            is_feasible=sim_result.is_feasible,
            projected_finish_date=last_task_date,
            original_deadline=req.current_deadline.isoformat(),
            deadline_met=deadline_met,
            average_daily_study_hours=avg_daily_hours,
            simulated_tasks=sim_result.tasks,
            risk_assessment=risk,
            tradeoffs=tradeoffs
        )
