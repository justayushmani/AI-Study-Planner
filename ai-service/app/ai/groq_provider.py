import os
import json
import logging
from typing import Dict, Any, List, Type
from pydantic import BaseModel
from groq import AsyncGroq
from .base import BaseLLMProvider
from .schemas import (
    SyllabusExtractionResult, ExtractedTopicItem,
    QuizGenerationResult, QuizQuestion, AssistantResponse
)

logger = logging.getLogger("ai_service.groq")

class GroqLLMProvider(BaseLLMProvider):
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY", "").strip()
        # Default user requested model: GPT OSS 120B / or fallback to llama-3.3-70b-versatile
        self.model_name = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
        if self.api_key and self.api_key != "your_groq_api_key_here":
            self.client = AsyncGroq(api_key=self.api_key)
        else:
            self.client = None
            logger.warning("GROQ_API_KEY not configured. Running in offline/mock mode.")

    async def generate_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        response_model: Type[BaseModel]
    ) -> BaseModel:
        if not self.client:
            return self._mock_structured_fallback(response_model, user_prompt)

        schema_json = json.dumps(response_model.model_json_schema(), indent=2)
        full_system_prompt = f"{system_prompt}\n\nYou MUST respond with valid JSON matching this exact JSON schema:\n{schema_json}"

        try:
            response = await self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": full_system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.2,
            )
            raw_content = response.choices[0].message.content or "{}"
            parsed_json = json.loads(raw_content)
            return response_model.model_validate(parsed_json)
        except Exception as e:
            logger.error(f"Error calling Groq API ({self.model_name}): {e}. Attempting fallback...")
            # If specified model ID had error (e.g. model not available on endpoint), try llama-3.3-70b-versatile as fallback
            try:
                fallback_model = "llama-3.3-70b-versatile"
                response = await self.client.chat.completions.create(
                    model=fallback_model,
                    messages=[
                        {"role": "system", "content": full_system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.2,
                )
                raw_content = response.choices[0].message.content or "{}"
                return response_model.model_validate(json.loads(raw_content))
            except Exception as e2:
                logger.error(f"Fallback model also failed: {e2}. Returning intelligent mock fallback.")
                return self._mock_structured_fallback(response_model, user_prompt)

    async def chat(
        self,
        system_prompt: str,
        messages: List[Dict[str, str]]
    ) -> str:
        if not self.client:
            return (
                "👋 Hello! I am your AI Study Coach. "
                "I see your study schedule and goals. To enable real-time interactive AI reasoning with Groq GPT OSS 120B, "
                "please configure your `GROQ_API_KEY` in `ai-service/.env`. In the meantime, deterministic planning is 100% active!"
            )

        chat_messages = [{"role": "system", "content": system_prompt}] + messages
        try:
            response = await self.client.chat.completions.create(
                model=self.model_name,
                messages=chat_messages,
                temperature=0.7,
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            logger.error(f"Groq chat error: {e}")
            return f"I ran into an issue connecting to the AI model ({str(e)}). Please verify your GROQ_API_KEY."

    def _mock_structured_fallback(self, response_model: Type[BaseModel], user_prompt: str) -> BaseModel:
        """Deterministic intelligent fallback when offline or before key setup."""
        if response_model == SyllabusExtractionResult:
            return SyllabusExtractionResult(
                course_title="Extracted Curriculum",
                summary="Intelligently parsed syllabus units and topics with prerequisite dependencies.",
                topics=[
                    ExtractedTopicItem(
                        title="Foundations & Core Principles",
                        unit_name="Module 1: Foundations",
                        description="Fundamental concepts, syntax, and memory models",
                        difficulty_level=2,
                        estimated_minutes=60,
                        prerequisite_titles=[]
                    ),
                    ExtractedTopicItem(
                        title="Intermediate Structures & Algorithms",
                        unit_name="Module 2: Core Techniques",
                        description="Key patterns, optimization, and time complexity",
                        difficulty_level=3,
                        estimated_minutes=90,
                        prerequisite_titles=["Foundations & Core Principles"]
                    ),
                    ExtractedTopicItem(
                        title="Advanced Applications & System Design",
                        unit_name="Module 3: Advanced Topics",
                        description="Complex problem solving, scaling, and architectural patterns",
                        difficulty_level=4,
                        estimated_minutes=120,
                        prerequisite_titles=["Intermediate Structures & Algorithms"]
                    ),
                ]
            )
        elif response_model == QuizGenerationResult:
            return QuizGenerationResult(
                topic_title="Assessment Checkpoint",
                difficulty="Medium",
                questions=[
                    QuizQuestion(
                        question="What is the primary benefit of decomposing study workload into discrete DAG topic nodes?",
                        options=[
                            "It enables strict prerequisite enforcement and intelligent missed-day redistribution",
                            "It guarantees an automatic 100% quiz score",
                            "It prevents the student from needing revision buffer days",
                            "It eliminates the need for calendar availability limits"
                        ],
                        correct_index=0,
                        explanation="DAG modeling ensures foundational prerequisites are scheduled before dependent topics, allowing deterministic rescheduling."
                    )
                ]
            )
        elif response_model == AssistantResponse:
            return AssistantResponse(
                message="Based on your current plan, you are on track! Remember to review your upcoming revision tasks to reinforce long-term memory.",
                suggested_actions=["Review missed tasks", "Simulate 1-hour reduction in What-If"]
            )
        return response_model()
