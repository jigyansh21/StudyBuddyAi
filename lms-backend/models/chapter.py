"""
models/chapter.py
-----------------
ORM model representing a single chapter within a course.

Chapter Model
=============
A Chapter is the fundamental content unit inside a Course. Each chapter
may carry a video lecture URL, a PDF reference document, and an ordered
position index so students consume content sequentially.

Chapters also act as the parent entity for Resources (uploaded PDF study
materials). When a Chapter is deleted, SQLAlchemy automatically cascades
the deletion to all of its child Resource records.

Relationships
-------------
One Chapter
  -> belongs to one Course  (via course_id foreign key)
  -> many Resources         (via Resource.chapter_id, cascade="all, delete-orphan")

Ordering
--------
`chapter_order` is enforced to be unique within a course at the API
layer (routes/chapter.py) to prevent sequencing conflicts.

Table: chapters
"""

from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import ForeignKey
from sqlalchemy import DateTime

from sqlalchemy.orm import relationship

from datetime import datetime

from database import Base


class Chapter(Base):

    __tablename__ = "chapters"

    # Primary key. Auto-incremented by the database.
    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # Foreign key linking this chapter to its parent course.
    # Deleting the parent Course does not cascade here; chapters must be
    # deleted explicitly or via ORM-level cascade on the Course side.
    course_id = Column(
        Integer,
        ForeignKey("courses.id"),
        nullable=False
    )

    # Human-readable chapter name rendered in the course outline.
    title = Column(
        String,
        nullable=False
    )

    # Optional summary displayed beneath the chapter title in the student UI.
    description = Column(
        String,
        nullable=True
    )

    # External or CDN URL pointing to the lecture video for this chapter.
    # Null when no video has been uploaded or linked yet.
    video_url = Column(
        String,
        nullable=True
    )

    # URL to a companion PDF file stored in the /uploads static directory.
    # Null when no PDF has been attached to this chapter.
    pdf_url = Column(
        String,
        nullable=True
    )

    # 1-based integer that defines the playback sequence within the course.
    # The API layer rejects duplicate order values within the same course.
    chapter_order = Column(
        Integer,
        nullable=False
    )

    # UTC timestamp set once when the chapter record is first persisted.
    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    # UTC timestamp refreshed automatically whenever the record is updated.
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    # Provides access to the parent Course object from a Chapter instance.
    # Also populates Course.chapters as the back-reference collection.
    course = relationship(
        "Course",
        backref="chapters"
    )

    # Provides access to all Resources attached to this chapter.
    # cascade="all, delete-orphan" ensures child Resources are removed
    # from both the database and the vector store when a Chapter is deleted.
    resources = relationship(
        "Resource",
        back_populates="chapter",
        cascade="all, delete-orphan"
    )