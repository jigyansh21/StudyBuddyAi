"""
main.py
-------
Application entrypoint for the StudyBuddy AI backend.

Initializes the FastAPI application, configures CORS, mounts the static
file server for uploaded resources, runs SQLAlchemy DDL to ensure all
tables exist, and registers all API routers.

Server command:
    uvicorn main:app --host 127.0.0.1 --port 8000 --reload
"""

import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine

# ORM models must be imported before create_all so SQLAlchemy
# can discover their table definitions and generate DDL.
from models.user import User
from models.course import Course
from models.chapter import Chapter
from models.resource import Resource
from models.enrollment import Enrollment

# Route modules, each handling a distinct API domain.
from routes.auth import router as auth_router
from routes.course import router as course_router
from routes.chapter import router as chapter_router
from routes.resource import router as resource_router
from routes.chat import router as chat_router
from routes.enrollment import router as enrollment_router
from routes.admin import router as admin_router


app = FastAPI(
    title="StudyBuddy AI API",
    description="Backend for the StudyBuddy AI LMS platform. Provides authentication, "
                "course management, RAG-powered AI tutoring, and student progress tracking.",
    version="1.0.0",
)

# Ensure the uploads directory exists on every cold start.
# This directory stores PDF files uploaded by admins and is served statically.
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# CORS is restricted to the local Next.js dev server.
# Update allow_origins to include the production domain before deployment.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Run CREATE TABLE IF NOT EXISTS for all registered ORM models.
# Safe to call on every startup; existing tables are not modified.
Base.metadata.create_all(bind=engine)


# Register all API routers. Each router carries its own prefix and tag,
# visible in the auto-generated OpenAPI docs at /docs.
app.include_router(auth_router)
app.include_router(course_router)
app.include_router(chapter_router)
app.include_router(resource_router)
app.include_router(chat_router)
app.include_router(enrollment_router)
app.include_router(admin_router)


@app.get("/")
def home():
    """
    Health check endpoint.

    Returns a minimal JSON payload to confirm the server is running.
    Used by deployment health probes and local development verification.

    Returns:
        dict: Static confirmation message.
    """
    return {
        "message": "Backend Running"
    }