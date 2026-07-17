from pydantic import BaseModel
from typing import Optional


class ChapterCreate(BaseModel):

    title: str
    description: Optional[str] = None
    video_url: Optional[str] = None
    pdf_url: Optional[str] = None
    chapter_order: int


class ChapterUpdate(BaseModel):

    title: str
    description: Optional[str] = None
    video_url: Optional[str] = None
    pdf_url: Optional[str] = None
    chapter_order: int


class ChapterResponse(BaseModel):

    id: int
    course_id: int

    title: str
    description: Optional[str]
    video_url: Optional[str]
    pdf_url: Optional[str]
    chapter_order: int

    class Config:
        from_attributes = True