"""
schemas/chapter.py
------------------
Pydantic request and response schemas for the /chapters endpoints.

Schema Responsibilities
-----------------------
ChapterCreate   -- Validates the JSON body for POST /chapters/:course_id
ChapterUpdate   -- Validates the JSON body for PUT /chapters/:chapter_id
ChapterResponse -- Shapes serialised Chapter objects returned by GET
                   endpoints, including the parent course_id reference
                   needed for client-side routing.

chapter_order Semantics
-----------------------
`chapter_order` is a required integer on both create and update schemas.
The API layer enforces uniqueness within a course; submitting a duplicate
order value returns HTTP 400.

ORM Mode
--------
`Config.from_attributes = True` allows ChapterResponse to be constructed
directly from a SQLAlchemy Chapter ORM instance without manual field
mapping.
"""

from pydantic import BaseModel
from typing import Optional


class ChapterCreate(BaseModel):
    """
    Request body for POST /chapters/:course_id.

    `chapter_order` determines where this chapter appears in the course
    outline. The API rejects duplicate order values within the same course.
    """

    title: str

    # Optional summary shown beneath the chapter title in the student view.
    description: Optional[str] = None

    # External or CDN URL to the lecture video. May be supplied later.
    video_url: Optional[str] = None

    # Path or URL to an attached PDF companion. May be supplied later.
    pdf_url: Optional[str] = None

    # Sequential position of this chapter within the course (1-based).
    chapter_order: int


class ChapterUpdate(BaseModel):
    """
    Request body for PUT /chapters/:chapter_id.

    Mirrors ChapterCreate — a PUT replaces all fields atomically.
    The API guards against order conflicts with other chapters in the
    same course before committing the update.
    """

    title: str
    description: Optional[str] = None
    video_url: Optional[str] = None
    pdf_url: Optional[str] = None
    chapter_order: int


class ChapterResponse(BaseModel):
    """
    Serialised shape returned by GET /chapters/course/:id and
    GET /chapters/:chapter_id.

    Includes `course_id` so clients can resolve the parent course
    without a separate lookup.
    """

    id: int

    # Parent course identifier included for client-side navigation.
    course_id: int

    title: str
    description: Optional[str]
    video_url: Optional[str]
    pdf_url: Optional[str]
    chapter_order: int

    class Config:
        # Allows instantiation from SQLAlchemy ORM model instances.
        from_attributes = True