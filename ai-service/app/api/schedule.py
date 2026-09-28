from fastapi import APIRouter, HTTPException
from ..scheduler.models import (
    TopicInput, AvailabilityInput, PlanConstraints,
    ScheduleResult, RescheduleRequest, WhatIfRequest, WhatIfResponse
)
from ..scheduler.planner import DeterministicPlanner
from ..scheduler.rescheduler import IntelligentRescheduler
from ..scheduler.what_if import WhatIfSimulator
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/schedule", tags=["Deterministic Scheduler"])

class GeneratePlanRequest(BaseModel):
    topics: List[TopicInput]
    availability: AvailabilityInput
    constraints: PlanConstraints

@router.post("/generate", response_model=ScheduleResult)
async def generate_plan(req: GeneratePlanRequest):
    try:
        planner = DeterministicPlanner(req.topics, req.availability, req.constraints)
        return planner.generate_schedule()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/reschedule")
async def reschedule_plan(req: RescheduleRequest):
    try:
        new_result, diff = IntelligentRescheduler.reschedule(req)
        return {
            "result": new_result,
            "diff": diff
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/what-if", response_model=WhatIfResponse)
async def simulate_what_if(req: WhatIfRequest):
    try:
        return WhatIfSimulator.simulate(req)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
