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

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    course_id = Column(
        Integer,
        ForeignKey("courses.id"),
        nullable=False
    )

    title = Column(
        String,
        nullable=False
    )

    description = Column(
        String,
        nullable=True
    )

    video_url = Column(
        String,
        nullable=True
    )

    pdf_url = Column(
        String,
        nullable=True
    )

    chapter_order = Column(
        Integer,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    course = relationship(
        "Course",
        backref="chapters"
    )

    resources = relationship(
        "Resource",
        back_populates="chapter",
        cascade="all, delete-orphan"
    )