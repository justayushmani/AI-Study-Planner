from datetime import date, timedelta
import pytest
from app.scheduler.models import (
    TopicInput, AvailabilityInput, PlanConstraints,
    ScheduledTask, RescheduleRequest, WhatIfRequest
)
from app.scheduler.dependency import DependencyResolver
from app.scheduler.priority import PriorityEngine
from app.scheduler.planner import DeterministicPlanner
from app.scheduler.rescheduler import IntelligentRescheduler
from app.scheduler.what_if import WhatIfSimulator

def create_sample_topics():
    # Arrays -> Two Pointers -> Sliding Window
    # Graphs -> BFS/DFS
    return [
        TopicInput(
            id="t1",
            title="Arrays & Hashing",
            unit_name="Basics",
            difficulty_level=2,
            base_estimated_minutes=90,
            user_confidence_score=4,
            importance_score=4,
            prerequisites=[]
        ),
        TopicInput(
            id="t2",
            title="Two Pointers",
            unit_name="Arrays",
            difficulty_level=3,
            base_estimated_minutes=90,
            user_confidence_score=2, # Weak topic
            importance_score=4,
            prerequisites=["t1"]
        ),
        TopicInput(
            id="t3",
            title="Sliding Window",
            unit_name="Arrays",
            difficulty_level=4,
            base_estimated_minutes=90,
            user_confidence_score=1, # Very weak topic
            importance_score=5,
            prerequisites=["t2"]
        ),
        TopicInput(
            id="t4",
            title="Graphs Intro",
            unit_name="Graphs",
            difficulty_level=4,
            base_estimated_minutes=120,
            user_confidence_score=3,
            importance_score=4,
            prerequisites=[]
        ),
        TopicInput(
            id="t5",
            title="BFS & DFS Traversals",
            unit_name="Graphs",
            difficulty_level=4,
            base_estimated_minutes=120,
            user_confidence_score=2, # Weak topic
            importance_score=5,
            prerequisites=["t4"]
        ),
    ]

def test_dependency_resolver_acyclic():
    topics = create_sample_topics()
    resolver = DependencyResolver(topics)
    is_acyclic, cycles = resolver.validate_acyclic()
    assert is_acyclic is True
    assert len(cycles) == 0

    order = resolver.get_topological_order()
    # Verify t1 comes before t2, and t2 before t3
    assert order.index("t1") < order.index("t2")
    assert order.index("t2") < order.index("t3")
    assert order.index("t4") < order.index("t5")

def test_dependency_resolver_cycle_detection():
    # Intentionally circular: A -> B -> C -> A
    cyclic_topics = [
        TopicInput(id="a", title="A", prerequisites=["c"]),
        TopicInput(id="b", title="B", prerequisites=["a"]),
        TopicInput(id="c", title="C", prerequisites=["b"]),
    ]
    resolver = DependencyResolver(cyclic_topics)
    is_acyclic, cycles = resolver.validate_acyclic()
    assert is_acyclic is False
    assert len(cycles) > 0

def test_priority_engine():
    topics = create_sample_topics()
    resolver = DependencyResolver(topics)
    centrality = resolver.get_prerequisite_centrality()
    scores = PriorityEngine.calculate_scores(topics, centrality)
    
    # t3 (confidence 1, very weak) should have higher priority than t1 (confidence 4)
    assert scores["t3"] > scores["t1"]

def test_deterministic_planner_generates_schedule():
    topics = create_sample_topics()
    start = date(2026, 10, 1)
    deadline = date(2026, 10, 20) # 20 days

    availability = AvailabilityInput(
        weekly_hours={
            "Monday": 2.0, "Tuesday": 2.0, "Wednesday": 2.0,
            "Thursday": 2.0, "Friday": 2.0, "Saturday": 3.0, "Sunday": 3.0
        },
        preferred_study_time="Evening"
    )

    constraints = PlanConstraints(
        start_date=start,
        deadline=deadline,
        buffer_days=3,
        revision_frequency_days=5
    )

    planner = DeterministicPlanner(topics, availability, constraints)
    result = planner.generate_schedule()

    assert result.is_feasible is True
    assert len(result.tasks) > 0
    assert len(result.buffer_dates) > 0
    assert result.total_allocated_minutes >= sum(t.base_estimated_minutes for t in topics)

    # Check prerequisite task ordering in schedule
    task_topic_order = []
    for t in result.tasks:
        if t.task_type == "Study" and t.topic_id not in task_topic_order:
            task_topic_order.append(t.topic_id)
            
    assert task_topic_order.index("t1") < task_topic_order.index("t2")
    assert task_topic_order.index("t2") < task_topic_order.index("t3")

def test_intelligent_rescheduler():
    topics = create_sample_topics()
    start = date(2026, 10, 1)
    deadline = date(2026, 10, 20)

    availability = AvailabilityInput(
        weekly_hours={"Monday": 2.0, "Tuesday": 2.0, "Wednesday": 2.0, "Thursday": 2.0, "Friday": 2.0, "Saturday": 3.0, "Sunday": 3.0}
    )
    constraints = PlanConstraints(start_date=start, deadline=deadline, buffer_days=3)
    planner = DeterministicPlanner(topics, availability, constraints)
    initial_res = planner.generate_schedule()

    # Simulate: User completed first task, but missed second task on Day 2
    initial_res.tasks[0].status = "Completed"
    missed_task_id = initial_res.tasks[1].id
    
    resched_req = RescheduleRequest(
        today=date(2026, 10, 3),
        deadline=deadline,
        weekly_hours=availability.weekly_hours,
        completed_task_ids=[initial_res.tasks[0].id],
        missed_task_ids=[missed_task_id],
        existing_tasks=initial_res.tasks,
        all_topics=topics,
        buffer_days=2
    )

    new_result, diff = IntelligentRescheduler.reschedule(resched_req)
    assert new_result.is_feasible is True
    assert diff["missed_tasks_count"] >= 1
    assert diff["deadline_maintained"] is True

def test_what_if_simulator():
    topics = create_sample_topics()
    today = date(2026, 10, 1)
    deadline = date(2026, 10, 20)

    availability = AvailabilityInput(
        weekly_hours={"Monday": 2.0, "Tuesday": 2.0, "Wednesday": 2.0, "Thursday": 2.0, "Friday": 2.0, "Saturday": 3.0, "Sunday": 3.0}
    )
    constraints = PlanConstraints(start_date=today, deadline=deadline)
    planner = DeterministicPlanner(topics, availability, constraints)
    initial_res = planner.generate_schedule()

    # Scenario: Cut study time in half (1 hour per day)
    req = WhatIfRequest(
        today=today,
        current_deadline=deadline,
        hypothetical_weekly_hours={
            "Monday": 1.0, "Tuesday": 1.0, "Wednesday": 1.0,
            "Thursday": 1.0, "Friday": 1.0, "Saturday": 1.0, "Sunday": 1.0
        },
        existing_tasks=initial_res.tasks,
        all_topics=topics
    )

    sim = WhatIfSimulator.simulate(req)
    assert sim.risk_assessment is not None
    assert len(sim.tradeoffs) > 0
