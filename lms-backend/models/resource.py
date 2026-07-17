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

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    chapter_id = Column(
        Integer,
        ForeignKey("chapters.id"),
        nullable=False
    )

    title = Column(
        String,
        nullable=False
    )

    resource_type = Column(
        String,
        nullable=False
    )

    file_url = Column(
        String,
        nullable=False
    )

    description = Column(
        String,
        nullable=True
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

    chapter = relationship(
        "Chapter",
        back_populates="resources"
    )