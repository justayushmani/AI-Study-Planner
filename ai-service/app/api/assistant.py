from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from pydantic import BaseModel
from ..ai.groq_provider import GroqLLMProvider
from ..ai.prompts import AI_ASSISTANT_SYSTEM_PROMPT

router = APIRouter(prefix="/assistant", tags=["AI Study Assistant"])
llm_provider = GroqLLMProvider()

class AssistantChatRequest(BaseModel):
    messages: List[Dict[str, str]]
    study_context: Dict[str, Any]

@router.post("/chat")
async def chat_with_assistant(req: AssistantChatRequest):
    try:
        # Contextualize system prompt with current student stats
        context_str = f"""
Student Context:
- Active Goal: {req.study_context.get('goal_title', 'General Study')}
- Deadline: {req.study_context.get('deadline', 'Upcoming')}
- Completed Tasks: {req.study_context.get('completed_count', 0)}
- Missed Tasks: {req.study_context.get('missed_count', 0)}
- Weak Topics: {', '.join(req.study_context.get('weak_topics', ['None identified']))}
- Next Task: {req.study_context.get('next_task', 'None')}
"""
        full_system_prompt = f"{AI_ASSISTANT_SYSTEM_PROMPT}\n\n{context_str}"
        response_text = await llm_provider.chat(
            system_prompt=full_system_prompt,
            messages=req.messages
        )
        return {
            "reply": response_text
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
