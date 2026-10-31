import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from .api.schedule import router as schedule_router
from .api.extract import router as extract_router
from .api.quiz import router as quiz_router
from .api.assistant import router as assistant_router

app = FastAPI(
    title="AI Study Planner — Planning & AI Service",
    description="Deterministic DAG scheduling, document extraction, quiz generation, and AI study coach.",
    version="1.0.0"
)

# CORS configuration — read allowed origins from environment for production
_default_origins = [
    "http://localhost:5173",
    "http://localhost:5000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5000",
]

# Add production URLs from environment variables if set
for _env_key in ("BACKEND_URL", "FRONTEND_URL"):
    _url = os.getenv(_env_key)
    if _url and _url not in _default_origins:
        _default_origins.append(_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_default_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(schedule_router)
app.include_router(extract_router)
app.include_router(quiz_router)
app.include_router(assistant_router)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ai-service",
        "llm_model": os.getenv("GROQ_MODEL", "openai/gpt-oss-120b"),
        "groq_configured": bool(os.getenv("GROQ_API_KEY") and os.getenv("GROQ_API_KEY") != "your_groq_api_key_here")
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("AI_PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
