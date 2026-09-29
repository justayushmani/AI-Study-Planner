import uuid
from datetime import date, timedelta
from typing import List, Dict, Set
from .models import (
    TopicInput, AvailabilityInput, PlanConstraints,
    ScheduledTask, ScheduleResult
)
from .dependency import DependencyResolver
from .priority import PriorityEngine
from .constraints import ConstraintManager
from .validator import ScheduleValidator

class DeterministicPlanner:
    """
    Core Deterministic Scheduling Engine.
    Enforces DAG prerequisites, priority weights, daily capacity limits,
    spaced revision, and buffer protection.
    """

    def __init__(
        self,
        topics: List[TopicInput],
        availability: AvailabilityInput,
        constraints: PlanConstraints
    ):
        self.topics = topics
        self.topic_map = {t.id: t for t in topics}
        self.availability = availability
        self.constraints = constraints
        self.resolver = DependencyResolver(topics)

    def generate_schedule(self) -> ScheduleResult:
        # 1. Validate DAG cycles
        is_acyclic, cycles = self.resolver.validate_acyclic()
        if not is_acyclic:
            return ScheduleResult(
                is_feasible=False,
                total_allocated_minutes=0,
                total_study_days=0,
                buffer_dates=[],
                tasks=[],
                warnings=[f"Circular prerequisite dependency detected between topics: {cycles}"]
            )

        # 2. Get prerequisite centrality and calculate priority scores
        centrality = self.resolver.get_prerequisite_centrality()
        priority_scores = PriorityEngine.calculate_scores(self.topics, centrality)

        # 3. Calendar & Capacity calculation
        calendar_days = ConstraintManager.get_calendar_days(
            self.constraints.start_date, self.constraints.deadline
        )
        daily_capacity = ConstraintManager.calculate_available_minutes_per_day(
            calendar_days, self.availability, getattr(self.constraints, 'blackout_dates', [])
        )
        study_days, buffer_days = ConstraintManager.partition_buffer_days(
            calendar_days, self.constraints.buffer_days, daily_capacity
        )

        total_req_minutes = sum(t.base_estimated_minutes for t in self.topics)
        total_study_capacity = sum(daily_capacity.get(d, 0) for d in study_days)
        total_all_capacity = sum(daily_capacity.get(d, 0) for d in calendar_days)
        
        # 4. Feasibility validation
        is_feasible, val_warnings = ScheduleValidator.validate_plan_inputs(
            self.topics, self.availability, self.constraints, daily_capacity, study_days
        )

        pace_suggestions = []
        if total_req_minutes > total_study_capacity:
            active_study_day_count = max(1, len([d for d in study_days if daily_capacity.get(d, 0) > 0]))
            needed_daily_mins = total_req_minutes / active_study_day_count
            current_avg_mins = (total_study_capacity / active_study_day_count) if active_study_day_count > 0 else 0
            additional_mins = max(0, int(needed_daily_mins - current_avg_mins))
            pace_suggestions.append(
                f"Workload suggestion: To meet your deadline comfortably, increase your study time by ~{additional_mins} mins/day (target: {needed_daily_mins/60.0:.1f} hrs/day)."
            )

        if not is_feasible:
            # If not feasible in study days alone, check if usable with buffer days
            if total_req_minutes <= total_all_capacity:
                # Emergency fallback: borrow from buffer days
                study_days = [d for d in calendar_days if daily_capacity.get(d, 0) > 0]
                buffer_days = []
                val_warnings.append("Note: Schedule required utilizing reserved buffer days to meet the deadline.")
            else:
                active_days = max(1, len([d for d in calendar_days if daily_capacity.get(d, 0) > 0]))
                req_daily_hrs = round((total_req_minutes / active_days) / 60.0, 1)
                return ScheduleResult(
                    is_feasible=False,
                    total_allocated_minutes=0,
                    total_study_days=len(study_days),
                    buffer_dates=[d.isoformat() for d in buffer_days],
                    tasks=[],
                    warnings=val_warnings + [
                        f"Current schedule requires {total_req_minutes/60.0:.1f}h of study across {active_days} days. Increase your daily availability to at least {req_daily_hrs}h/day to fit all topics before deadline."
                    ],
                    suggestions=pace_suggestions,
                    stats={
                        "required_daily_hours": req_daily_hrs,
                        "total_required_hours": round(total_req_minutes / 60.0, 1)
                    }
                )

        # 5. Dependency-aware Task Scheduling
        # We track completed topics and dynamically pick candidate topics whose prerequisites are met
        completed_topic_ids: Set[str] = set()
        scheduled_tasks: List[ScheduledTask] = []
        
        # Topic workload tracker (minutes remaining for each topic)
        remaining_workload = {t.id: t.base_estimated_minutes for t in self.topics}
        topic_completion_dates: Dict[str, date] = {}

        # Daily scheduling loop
        start_hour, start_min = ConstraintManager.get_start_time_offset(
            self.availability.preferred_study_time,
            self.availability.custom_start_time or "18:00"
        )

        for current_day in study_days:
            day_capacity = daily_capacity[current_day]
            day_used_minutes = 0
            order_in_day = 1
            curr_slot_minutes = start_hour * 60 + start_min

            # First, check if any completed topics are due for spaced revision
            revision_candidates = [
                tid for tid, comp_date in topic_completion_dates.items()
                if (current_day - comp_date).days >= self.constraints.revision_frequency_days
                and not any(st.topic_id == tid and st.task_type == "Revision" for st in scheduled_tasks)
            ]

            for rev_tid in revision_candidates:
                if day_used_minutes + 30 <= day_capacity:
                    rev_topic = self.topic_map[rev_tid]
                    s_hour = curr_slot_minutes // 60
                    s_min = curr_slot_minutes % 60
                    end_slot = curr_slot_minutes + 30
                    e_hour = end_slot // 60
                    e_min = end_slot % 60

                    scheduled_tasks.append(
                        ScheduledTask(
                            id=str(uuid.uuid4()),
                            topic_id=rev_tid,
                            topic_title=rev_topic.title,
                            unit_name=rev_topic.unit_name,
                            scheduled_date=current_day.isoformat(),
                            start_time=f"{s_hour:02d}:{s_min:02d}",
                            end_time=f"{e_hour:02d}:{e_min:02d}",
                            duration_minutes=30,
                            task_type="Revision",
                            order_in_day=order_in_day,
                            status="Not Started"
                        )
                    )
                    day_used_minutes += 30
                    curr_slot_minutes += 30
                    order_in_day += 1

            # Second, schedule active topics
            while day_used_minutes < day_capacity:
                # Find all topics that:
                # 1. Have remaining workload > 0
                # 2. All prerequisites are already completed
                eligible_topics = [
                    t for t in self.topics
                    if remaining_workload[t.id] > 0
                    and all(p in completed_topic_ids for p in t.prerequisites)
                ]

                if not eligible_topics:
                    break

                # Sort eligible topics by priority score descending
                eligible_topics.sort(
                    key=lambda t: priority_scores.get(t.id, 1.0),
                    reverse=True
                )

                selected_topic = eligible_topics[0]
                minutes_needed = remaining_workload[selected_topic.id]
                space_available = day_capacity - day_used_minutes

                # Chunking: allocate up to chunk size (default 45 min) or whatever fits
                chunk_size = min(
                    minutes_needed,
                    space_available,
                    self.constraints.session_chunk_minutes
                )

                if chunk_size < 15 and minutes_needed >= 15:
                    # Not enough room for a meaningful study session today
                    break

                s_hour = curr_slot_minutes // 60
                s_min = curr_slot_minutes % 60
                end_slot = curr_slot_minutes + chunk_size
                e_hour = end_slot // 60
                e_min = end_slot % 60

                scheduled_tasks.append(
                    ScheduledTask(
                        id=str(uuid.uuid4()),
                        topic_id=selected_topic.id,
                        topic_title=selected_topic.title,
                        unit_name=selected_topic.unit_name,
                        scheduled_date=current_day.isoformat(),
                        start_time=f"{s_hour:02d}:{s_min:02d}",
                        end_time=f"{e_hour:02d}:{e_min:02d}",
                        duration_minutes=chunk_size,
                        task_type="Study",
                        order_in_day=order_in_day,
                        status="Not Started"
                    )
                )

                remaining_workload[selected_topic.id] -= chunk_size
                day_used_minutes += chunk_size
                curr_slot_minutes += chunk_size
                order_in_day += 1

                # If topic workload is now 0, mark as completed and optionally add a quick quiz task
                if remaining_workload[selected_topic.id] == 0:
                    completed_topic_ids.add(selected_topic.id)
                    topic_completion_dates[selected_topic.id] = current_day

                    if self.constraints.include_quizzes and (day_used_minutes + 15 <= day_capacity):
                        qs_hour = curr_slot_minutes // 60
                        qs_min = curr_slot_minutes % 60
                        qend_slot = curr_slot_minutes + 15
                        qe_hour = qend_slot // 60
                        qe_min = qend_slot % 60

                        scheduled_tasks.append(
                            ScheduledTask(
                                id=str(uuid.uuid4()),
                                topic_id=selected_topic.id,
                                topic_title=f"Quiz: {selected_topic.title}",
                                unit_name=selected_topic.unit_name,
                                scheduled_date=current_day.isoformat(),
                                start_time=f"{qs_hour:02d}:{qs_min:02d}",
                                end_time=f"{qe_hour:02d}:{qe_min:02d}",
                                duration_minutes=15,
                                task_type="Quiz",
                                order_in_day=order_in_day,
                                status="Not Started"
                            )
                        )
                        day_used_minutes += 15
                        curr_slot_minutes += 15
                        order_in_day += 1

        total_allocated = sum(st.duration_minutes for st in scheduled_tasks)
        unallocated_topics = [t.title for t in self.topics if remaining_workload[t.id] > 0]
        warnings = list(val_warnings)
        if unallocated_topics:
            warnings.append(
                f"Could not fit complete syllabus within time frame. Remaining topics: {', '.join(unallocated_topics[:3])}..."
            )

        return ScheduleResult(
            is_feasible=len(unallocated_topics) == 0,
            total_allocated_minutes=total_allocated,
            total_study_days=len(study_days),
            buffer_dates=[d.isoformat() for d in buffer_days],
            tasks=scheduled_tasks,
            warnings=warnings,
            stats={
                "total_tasks": float(len(scheduled_tasks)),
                "buffer_days_preserved": float(len(buffer_days)),
                "allocated_hours": round(total_allocated / 60.0, 1),
                "completion_ratio": round((len(self.topics) - len(unallocated_topics)) / len(self.topics), 2)
            }
        )
