from datetime import date, time
from typing import List, Dict, Optional, Literal
from pydantic import BaseModel, Field

class TopicInput(BaseModel):
    id: str
    title: str
    unit_name: str = "General"
    difficulty_level: int = Field(default=3, ge=1, le=5) # 1 to 5
    base_estimated_minutes: int = Field(default=60, ge=15)
    user_confidence_score: int = Field(default=3, ge=1, le=5) # 1=Very Weak, 5=Strong
    importance_score: int = Field(default=3, ge=1, le=5) # 1 to 5
    prerequisites: List[str] = Field(default_factory=list) # IDs of prerequisite topics

class AvailabilityInput(BaseModel):
    weekly_hours: Dict[str, float] = Field(
        default_factory=lambda: {
            "Monday": 2.0,
            "Tuesday": 2.0,
            "Wednesday": 2.0,
            "Thursday": 2.0,
            "Friday": 2.0,
            "Saturday": 4.0,
            "Sunday": 4.0
        }
    )
    preferred_study_time: Literal["Morning", "Afternoon", "Evening", "Custom"] = "Evening"
    custom_start_time: Optional[str] = "18:00" # HH:MM
    max_daily_minutes_cap: int = 360 # Hard limit 6 hours

class PlanConstraints(BaseModel):
    start_date: date
    deadline: date
    buffer_days: int = 3
    revision_frequency_days: int = 7
    session_chunk_minutes: int = 45
    break_chunk_minutes: int = 15
    include_quizzes: bool = True
    blackout_dates: List[date] = Field(default_factory=list) # Vacation / family leave days

class ScheduledTask(BaseModel):
    id: str
    topic_id: str
    topic_title: str
    unit_name: str = "General"
    scheduled_date: str # YYYY-MM-DD
    start_time: str # HH:MM
    end_time: str # HH:MM
    duration_minutes: int
    task_type: Literal["Study", "Practice", "Revision", "Quiz"] = "Study"
    order_in_day: int
    status: Literal["Not Started", "In Progress", "Completed", "Skipped"] = "Not Started"

class ScheduleResult(BaseModel):
    plan_id: Optional[str] = None
    is_feasible: bool
    total_allocated_minutes: int
    total_study_days: int
    buffer_dates: List[str]
    tasks: List[ScheduledTask]
    warnings: List[str] = Field(default_factory=list)
    stats: Dict[str, float] = Field(default_factory=dict)
    suggestions: List[str] = Field(default_factory=list)

class RescheduleRequest(BaseModel):
    today: date
    deadline: date
    weekly_hours: Dict[str, float]
    completed_task_ids: List[str] = Field(default_factory=list)
    missed_task_ids: List[str] = Field(default_factory=list)
    existing_tasks: List[ScheduledTask]
    all_topics: List[TopicInput]
    buffer_days: int = 3
    preferred_study_time: str = "Evening"
    blackout_dates: List[date] = Field(default_factory=list) # e.g. vacation dates
    adjusted_daily_hours_increase: float = 0.0 # user accepted pace increase in hours/day
    reason: Optional[str] = "Dynamic Reschedule"

class WhatIfRequest(BaseModel):
    today: date
    current_deadline: date
    hypothetical_deadline: Optional[date] = None
    hypothetical_weekly_hours: Optional[Dict[str, float]] = None
    hypothetical_buffer_days: Optional[int] = None
    blackout_dates: List[date] = Field(default_factory=list)
    existing_tasks: List[ScheduledTask]
    all_topics: List[TopicInput]

class WhatIfResponse(BaseModel):
    is_feasible: bool
    projected_finish_date: str
    original_deadline: str
    deadline_met: bool
    average_daily_study_hours: float
    simulated_tasks: List[ScheduledTask]
    risk_assessment: str
    tradeoffs: List[str]
