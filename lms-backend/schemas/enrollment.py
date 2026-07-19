"""
schemas/enrollment.py
---------------------
Pydantic request and response schemas for the /enrollments endpoints.

Schema Responsibilities
-----------------------
EnrollmentCreate   -- Validates the JSON body for enrollment requests.
                      In practice the route uses a path parameter for
                      course_id, so this schema is defined for
                      completeness but may be superseded by path params.
EnrollmentResponse -- Serialised enrollment record returned after a
                      successful enrollment or progress update.
                      Includes the nested CourseResponse to allow
                      clients to display course metadata without a
                      secondary fetch.

Nested Schema
-------------
`course` is declared Optional to handle the case where the ORM
relationship is not eagerly loaded (lazy loading returns None until
explicitly accessed). The admin and student dashboard endpoints that
return enriched enrollment data build their own custom dict structures
rather than relying on this nested field.

ORM Mode
--------
`Config.from_attributes = True` allows EnrollmentResponse to be
constructed directly from a SQLAlchemy Enrollment ORM instance.
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from schemas.course import CourseResponse


class EnrollmentCreate(BaseModel):
    """
    Request schema for enrolling in a course.

    Defined for API contract completeness; the enroll_in_course route
    reads course_id from the URL path parameter rather than the request
    body.
    """

    course_id: int


class EnrollmentResponse(BaseModel):
    """
    Serialised shape returned by POST /enrollments/:course_id.

    Contains the enrollment metadata and an optional nested course
    object. The `enrolled_at` datetime is included for display in the
    student's enrolled-courses list.
    """

    id: int

    # Identifier of the student who created this enrollment.
    user_id: int

    # Identifier of the enrolled course.
    course_id: int

    # Completion percentage at the time of serialisation, in [0.0, 100.0].
    progress_percent: float

    # UTC datetime recorded when the enrollment was first created.
    enrolled_at: datetime

    # Eagerly loaded course details, if the ORM relationship was resolved.
    # May be None when the response is built from a partially loaded object.
    course: Optional[CourseResponse] = None

    class Config:
        # Allows instantiation from SQLAlchemy ORM model instances.
        from_attributes = True
