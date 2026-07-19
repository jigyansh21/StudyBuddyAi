"""
models/resource.py
------------------
ORM model representing a PDF study resource attached to a chapter.

Resource Model
==============
A Resource is a PDF file uploaded by an administrator and associated
with a specific Chapter. Upon upload, the file is persisted to the local
filesystem under `uploads/resources/` and its text content is extracted,
chunked, and indexed into the ChromaDB vector store via the RAG pipeline
(services/rag_service.py).

This dual-write (filesystem + vector store) allows the AI Tutor to
retrieve contextually relevant excerpts from uploaded study materials
when answering student questions.

Relationships
-------------
One Resource
  -> belongs to one Chapter (via chapter_id foreign key)

Cascade Behaviour
-----------------
When the parent Chapter is deleted, SQLAlchemy's cascade="all,
delete-orphan" on Chapter.resources ensures this Resource is also
removed from the database. The route handler (routes/resource.py)
additionally deletes the physical file and purges the ChromaDB chunks.

Table: resources
"""

from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import ForeignKey
from sqlalchemy import DateTime

from sqlalchemy.orm import relationship

from datetime import datetime

from database import Base


class Resource(Base):

    __tablename__ = "resources"

    # Primary key. Auto-incremented by the database.
    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # Foreign key linking this resource to its parent chapter.
    # The chapter determines which course's RAG context this resource
    # contributes to during AI Tutor queries.
    chapter_id = Column(
        Integer,
        ForeignKey("chapters.id"),
        nullable=False
    )

    # Descriptive name displayed in the admin Knowledge Base index table.
    # Derived from the uploaded filename when not explicitly provided.
    title = Column(
        String,
        nullable=False
    )

    # Classification label for the resource (e.g., "Notes", "Slides", "Assignment").
    # Defaults to "Notes" during dashboard uploads.
    resource_type = Column(
        String,
        nullable=False
    )

    # Server-relative path to the stored PDF file (e.g., "/uploads/resources/uuid_file.pdf").
    # Served statically by the /uploads mount; prepend the base API URL on the client.
    file_url = Column(
        String,
        nullable=False
    )

    # Optional admin-supplied description displayed alongside the resource in the UI.
    description = Column(
        String,
        nullable=True
    )

    # UTC timestamp set once when the resource record is first persisted.
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

    # Provides access to the parent Chapter object from a Resource instance.
    # back_populates keeps Chapter.resources and Resource.chapter in sync.
    chapter = relationship(
        "Chapter",
        back_populates="resources"
    )