from pydantic import BaseModel
from typing import Optional


class ResourceCreate(BaseModel):

    title: str
    description: Optional[str] = None
    resource_type: str
    file_url: str


class ResourceUpdate(BaseModel):

    title: str
    description: Optional[str] = None
    resource_type: str
    file_url: str


class ResourceResponse(BaseModel):

    id: int
    chapter_id: int

    title: str
    description: Optional[str]
    resource_type: str
    file_url: str

    class Config:
        from_attributes = True