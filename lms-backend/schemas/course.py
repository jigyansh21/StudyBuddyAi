from pydantic import BaseModel
from typing import Optional


class CourseCreate(BaseModel):

    title: str
    description: str
    category: str
    difficulty: str
    language: str

    thumbnail: Optional[str] = None
    intro_video: Optional[str] = None
    learning_outcomes: Optional[str] = None


class CourseUpdate(BaseModel):

    title: str
    description: str
    category: str
    difficulty: str
    language: str

    thumbnail: Optional[str] = None
    intro_video: Optional[str] = None
    learning_outcomes: Optional[str] = None


class CourseResponse(BaseModel):

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
        from_attributes = True