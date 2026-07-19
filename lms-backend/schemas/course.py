"""
schemas/course.py
-----------------
Pydantic request and response schemas for the /courses endpoints.

Schema Responsibilities
-----------------------
CourseCreate  -- Validates the JSON body for POST /courses/
CourseUpdate  -- Validates the JSON body for PUT /courses/:id
CourseResponse -- Shapes the serialised Course objects returned by GET
                  endpoints. Enables FastAPI's automatic response_model
                  filtering so internal columns are never accidentally
                  exposed.

Optional Fields
---------------
`thumbnail`, `intro_video`, and `learning_outcomes` are all optional to
allow admins to create a course immediately without having to supply
media assets upfront.

ORM Mode
--------
`Config.from_attributes = True` (Pydantic v2 equivalent of orm_mode)
allows CourseResponse to be instantiated directly from a SQLAlchemy
ORM object, enabling the `response_model=list[CourseResponse]` pattern
in route handlers.
"""

from pydantic import BaseModel
from typing import Optional


class CourseCreate(BaseModel):
    """
    Request body for POST /courses/.

    Requires the four categorical fields that define a course's identity
    in the catalog. Media and AI-config fields default to None and can be
    supplied later via PUT /courses/:id.
    """

    title: str
    description: str
    category: str
    difficulty: str
    language: str

    # URL to the course cover image. May be set after initial creation.
    thumbnail: Optional[str] = None

    # URL to an introductory video. May be set after initial creation.
    intro_video: Optional[str] = None

    # Free-text field for learning objectives and AI model configuration.
    # Stored as "Learn ... LLM: <model_name>" by the quick-create form.
    learning_outcomes: Optional[str] = None


class CourseUpdate(BaseModel):
    """
    Request body for PUT /courses/:id.

    Mirrors CourseCreate intentionally — a PUT replaces all fields.
    A PATCH endpoint for partial updates is not currently implemented.
    """

    title: str
    description: str
    category: str
    difficulty: str
    language: str

    thumbnail: Optional[str] = None
    intro_video: Optional[str] = None
    learning_outcomes: Optional[str] = None


class CourseResponse(BaseModel):
    """
    Serialised shape returned by GET /courses/ and GET /courses/:id.

    Does not include `created_at` or `updated_at` to keep the public
    API surface minimal. Timestamps are available in admin-specific
    endpoints (/admin-api/courses) where they are needed for sorting.
    """

    id: int

    title: str
    description: str
    category: str
    difficulty: str
    language: str

    thumbnail: Optional[str]
    intro_video: Optional[str]
    learning_outcomes: Optional[str]

    class Config:
        # Allows instantiation from SQLAlchemy ORM model instances.
        from_attributes = True