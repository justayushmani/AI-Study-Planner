from abc import ABC, abstractmethod
from typing import Dict, Any, List, Type
from pydantic import BaseModel

class BaseLLMProvider(ABC):
    @abstractmethod
    async def generate_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        response_model: Type[BaseModel]
    ) -> BaseModel:
        """Generates validated structured output matching response_model schema."""
        pass

    @abstractmethod
    async def chat(
        self,
        system_prompt: str,
        messages: List[Dict[str, str]]
    ) -> str:
        """Conducts conversational chat with study context."""
        pass
