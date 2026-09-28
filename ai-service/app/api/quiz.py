from fastapi import APIRouter, HTTPException
from ..ai.groq_provider import GroqLLMProvider
from ..ai.prompts import QUIZ_GENERATOR_SYSTEM_PROMPT
from ..ai.schemas import QuizGenerationResult
from pydantic import BaseModel

router = APIRouter(prefix="/quiz", tags=["Quiz Generation"])
llm_provider = GroqLLMProvider()

class QuizRequest(BaseModel):
    topic_title: str
    difficulty: str = "Medium"
    question_count: int = 3
    notes: str = ""

@router.post("/generate", response_model=QuizGenerationResult)
async def generate_quiz(req: QuizRequest):
    try:
        user_prompt = (
            f"Topic: {req.topic_title}\n"
            f"Target Difficulty: {req.difficulty}\n"
            f"Number of Questions: {req.question_count}\n"
            f"Context Notes: {req.notes}\n\n"
            "Generate a high-yield diagnostic quiz with questions, options, correct index, and explanations."
        )
        return await llm_provider.generate_structured(
            system_prompt=QUIZ_GENERATOR_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            response_model=QuizGenerationResult
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
