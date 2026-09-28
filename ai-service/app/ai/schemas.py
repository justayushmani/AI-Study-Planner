from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ExtractedTopicItem(BaseModel):
    title: str = Field(description="Clear title of the topic or concept")
    unit_name: str = Field(default="General", description="Module or Unit name")
    description: str = Field(default="", description="Key concepts covered")
    difficulty_level: int = Field(default=3, ge=1, le=5, description="Difficulty 1 (Beginner) to 5 (Advanced)")
    estimated_minutes: int = Field(default=60, ge=15, le=360, description="Base recommended study time in minutes")
    prerequisite_titles: List[str] = Field(default_factory=list, description="Titles of topics that must be learned before this topic")

class SyllabusExtractionResult(BaseModel):
    course_title: str = Field(default="Custom Curriculum")
    summary: str = Field(default="")
    topics: List[ExtractedTopicItem] = Field(default_factory=list)

class QuizQuestion(BaseModel):
    question: str
    options: List[str] = Field(description="List of 4 distinct choices")
    correct_index: int = Field(ge=0, le=3, description="Index (0-3) of correct option")
    explanation: str

class QuizGenerationResult(BaseModel):
    topic_title: str
    difficulty: str
    questions: List[QuizQuestion]

class AssistantResponse(BaseModel):
    message: str
    suggested_actions: List[str] = Field(default_factory=list)
    schedule_proposal: Optional[Dict[str, Any]] = None
