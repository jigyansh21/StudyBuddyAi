"""
models/course.py
----------------
ORM model representing a single published course on the platform.

Course Model
============
A Course is the top-level content unit created and managed by administrators.
Students discover and enroll in Courses through the student-facing catalog.

Relationships
-------------
One Course
  -> many Chapters  (via Chapter.course_id, backref="chapters")
  -> many Enrollments (via Enrollment.course_id, backref="enrollments")

Nullable Fields
---------------
`thumbnail` and `intro_video` are optional to allow admins to publish
a course immediately without requiring media assets upfront.

`learning_outcomes` stores the AI-model configuration hint set at
course-creation time (e.g., the LLM model name for the AI Tutor).

Timestamps
----------
Both `created_at` and `updated_at` are managed automatically.
`updated_at` uses `onupdate=datetime.utcnow` to refresh on every commit.

Table: courses
"""

from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import DateTime
from sqlalchemy import Text

from datetime import datetime

from database import Base


class Course(Base):

    __tablename__ = "courses"

    # Primary key. Auto-incremented by the database.
    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # Human-readable title displayed in the course catalog and admin dashboard.
    title = Column(
        String,
        nullable=False
    )

    # Detailed description of what the course covers. Rendered in the student catalog.
    description = Column(
        Text,
        nullable=False
    )

    # Subject area tag (e.g., "AI & Tech", "Mathematics"). Used for filtering.
    category = Column(
        String,
        nullable=False
    )

    # Skill level indicator (e.g., "Beginner", "Intermediate", "Advanced").
    difficulty = Column(
        String,
        nullable=False
    )

    # Instruction language (e.g., "English", "Hindi"). Surfaced in the student UI.
    language = Column(
        String,
        nullable=False
    )

    # URL to the course cover image. Served from the /uploads static directory.
    # Null when no thumbnail has been uploaded yet.
    thumbnail = Column(
        String,
        nullable=True
    )

    # URL to an introductory video for the course landing page.
    # Null when no intro video has been provided.
    intro_video = Column(
        String,
        nullable=True
    )

    # Free-text field that stores learning goals and, by convention, the
    # AI model configuration selected during quick course creation.
    learning_outcomes = Column(
        Text,
        nullable=True
    )

    # UTC timestamp set once when the course is first created.
    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    # UTC timestamp refreshed automatically on every subsequent update.
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )