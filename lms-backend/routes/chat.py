"""
routes/chat.py
--------------
FastAPI router for AI Tutor question-and-answer endpoints.

Endpoints
---------
POST /chat/query               -- General RAG query across all or filtered content.
POST /chat/course/:course_id   -- Convenience query scoped to a specific course.

AI Tutor Architecture
---------------------
Both endpoints delegate to `services/rag_service.query_rag`, which:
  1. Converts the student question to an embedding using Ollama's
     nomic-embed-text model.
  2. Performs a similarity search against the ChromaDB vector store,
     optionally filtered by course_id or chapter_id.
  3. Assembles the top-k retrieved chunks into a context window.
  4. Submits the context + question to the local Ollama LLM (llama3.2:3b)
     and streams back a response.

These endpoints do NOT require authentication, allowing unauthenticated
experimentation. Production deployments should add token validation to
prevent abuse of the local LLM.

Fallback Behaviour
------------------
If the ChromaDB search returns no relevant documents, the AI Tutor
responds with a message indicating insufficient context rather than
hallucinating an answer.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas.chat import ChatQueryRequest, ChatQueryResponse
from services.rag_service import query_rag
from models.course import Course

router = APIRouter(
    prefix="/chat",
    tags=["AI Tutor Chat (RAG)"]
)


@router.post("/query", response_model=ChatQueryResponse)
def ask_ai_tutor(
    request: ChatQueryRequest,
    db: Session = Depends(get_db)
):
    """
    POST /chat/query

    Submits a student question to the RAG-powered AI Tutor.

    The question is optionally scoped to a specific course or chapter
    via the request body. If neither scope is provided, the similarity
    search spans the entire ChromaDB knowledge base.

    API:
        POST /chat/query
        Body: { question, course_id?, chapter_id?, top_k? }

    Responses:
        200 ChatQueryResponse with LLM answer and source citations
        400 Question is empty or whitespace-only
    """

    # Reject empty queries before incurring embedding and LLM costs.
    if not request.question or not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    result = query_rag(
        question=request.question.strip(),
        course_id=request.course_id,
        chapter_id=request.chapter_id,
        top_k=request.top_k or 4
    )

    return result


@router.post("/course/{course_id}", response_model=ChatQueryResponse)
def ask_ai_tutor_for_course(
    course_id: int,
    request: ChatQueryRequest,
    db: Session = Depends(get_db)
):
    """
    POST /chat/course/:course_id

    Convenience endpoint for AI Tutor questions scoped to a single course.

    Verifies the course exists before forwarding the query to the RAG
    pipeline. The course_id in the URL path takes precedence over any
    course_id supplied in the request body.

    API:
        POST /chat/course/{course_id}
        Body: { question, chapter_id?, top_k? }

    Responses:
        200 ChatQueryResponse with LLM answer and source citations
        400 Question is empty or whitespace-only
        404 Course not found
    """

    # Validate the course before invoking the LLM to surface a clear 404
    # rather than silently searching across an empty or wrong dataset.
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course Not Found")

    if not request.question or not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    result = query_rag(
        question=request.question.strip(),
        course_id=course_id,
        chapter_id=request.chapter_id,
        top_k=request.top_k or 4
    )

    return result
