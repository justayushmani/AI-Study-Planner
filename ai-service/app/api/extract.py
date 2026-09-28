from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from ..syllabus.parser import DocumentParser
from ..ai.groq_provider import GroqLLMProvider
from ..ai.prompts import SYLLABUS_EXTRACTOR_SYSTEM_PROMPT
from ..ai.schemas import SyllabusExtractionResult
from pydantic import BaseModel

router = APIRouter(prefix="/extract", tags=["Syllabus Extraction"])
llm_provider = GroqLLMProvider()

class RawTextExtractRequest(BaseModel):
    raw_text: str
    course_name: str = "Custom Syllabus"

@router.post("/file", response_model=SyllabusExtractionResult)
async def extract_from_file(file: UploadFile = File(...)):
    filename = file.filename.lower()
    content = await file.read()

    try:
        if filename.endswith(".pdf"):
            text, page_count = DocumentParser.extract_text_from_pdf(content)
        elif filename.endswith(".docx"):
            text = DocumentParser.extract_text_from_docx(content)
        elif filename.endswith(".txt"):
            text = content.decode("utf-8", errors="ignore")
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF, DOCX, or TXT.")

        user_prompt = f"Analyze this syllabus text and extract topics, units, and dependencies:\n\n{text[:12000]}"
        result = await llm_provider.generate_structured(
            system_prompt=SYLLABUS_EXTRACTOR_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            response_model=SyllabusExtractionResult
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))

@router.post("/text", response_model=SyllabusExtractionResult)
async def extract_from_text(req: RawTextExtractRequest):
    try:
        user_prompt = f"Course Name: {req.course_name}\n\nSyllabus Outline:\n{req.raw_text}"
        result = await llm_provider.generate_structured(
            system_prompt=SYLLABUS_EXTRACTOR_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            response_model=SyllabusExtractionResult
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))
