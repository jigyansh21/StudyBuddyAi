"""
schemas/resource.py
-------------------
Pydantic request and response schemas for the /resources endpoints.

Schema Responsibilities
-----------------------
ResourceCreate   -- Represents the editable fields of a resource.
                    In practice, resource creation is handled via a
                    multipart form upload (not a JSON body), so this
                    schema is defined for contract completeness.
ResourceUpdate   -- Reserved for future PATCH/PUT support; currently
                    resource updates are not exposed via a dedicated
                    endpoint.
ResourceResponse -- Serialised resource record returned by
                    GET /resources/chapter/:id.

Note on Upload Workflow
-----------------------
The active upload endpoint (POST /resources/upload) uses FastAPI's
`UploadFile` and `Form` dependencies rather than a JSON body, so
ResourceCreate is not directly consumed by that route. Instead, the
route constructs the Resource ORM object directly from form fields.

ORM Mode
--------
`Config.from_attributes = True` allows ResourceResponse to be
constructed directly from a SQLAlchemy Resource ORM instance.
"""

from pydantic import BaseModel
from typing import Optional


class ResourceCreate(BaseModel):
    """
    JSON body schema for resource creation.

    Not used by the active multipart upload endpoint. Retained for
    API contract documentation and potential future REST-only endpoints.
    """

    title: str
    description: Optional[str] = None
    resource_type: str
    file_url: str


class ResourceUpdate(BaseModel):
    """
    JSON body schema for resource updates.

    Reserved for future implementation of PUT /resources/:id.
    """

    title: str
    description: Optional[str] = None
    resource_type: str
    file_url: str


class ResourceResponse(BaseModel):
    """
    Serialised shape returned by GET /resources/chapter/:chapter_id.

    Includes the server-relative `file_url` which must be prefixed with
    the API base URL on the client to construct a downloadable link.
    """

    id: int

    # Parent chapter identifier used for grouping resources in the student UI.
    chapter_id: int

    title: str
    description: Optional[str]

    # Classification label (e.g., "Notes", "Slides", "Assignment").
    resource_type: str

    # Server-relative path such as "/uploads/resources/uuid_file.pdf".
    file_url: str

    class Config:
        # Allows instantiation from SQLAlchemy ORM model instances.
        from_attributes = True