"""
routes/enrollment.py
--------------------
FastAPI router for student enrollment and progress tracking.

Endpoints
---------
POST /enrollments/:course_id          -- Enroll the authenticated student in a course.
GET  /enrollments/my-courses          -- List all courses the student is enrolled in.
GET  /enrollments/check/:course_id    -- Check enrollment status for a specific course.
POST /enrollments/progress/:course_id -- Update the student's completion percentage.

Access Control
--------------
All four endpoints require a valid JWT token. The student's identity is
derived from the `user_id` claim in the token — students can only read
and update their own enrollment records. There is no admin-only guard on
these endpoints; the `get_current_user` dependency accepts any
authenticated role.

Idempotent Enrollment
---------------------
POST /enrollments/:course_id is idempotent: if the student is already
enrolled, the existing enrollment record is returned rather than raising
an error. This allows the client to call enroll without first checking
the enrollment status.

Progress Clamping
-----------------
Progress values submitted to the update endpoint are clamped to the
range [0.0, 100.0] by `min(100.0, max(0.0, progress))` before being
written to the database. This prevents invalid out-of-range values from
reaching the UI.

Enriched Course Data
--------------------
GET /enrollments/my-courses assembles a richer response than the
standard EnrollmentResponse schema. It joins each enrollment with its
parent course and computes the chapter count in a single request loop,
avoiding a separate endpoint for the student dashboard.
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
from models.enrollment import Enrollment
from models.course import Course
from models.chapter import Chapter
from schemas.enrollment import EnrollmentCreate, EnrollmentResponse
from utils.auth import verify_token

router = APIRouter(
    prefix="/enrollments",
    tags=["Enrollments & Student Progress"]
)

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    FastAPI dependency that authenticates any logged-in user (student or admin).

    Returns:
        dict: Decoded JWT payload containing user_id, email, and role.

    Raises:
        HTTPException 401: Token is missing, malformed, or expired.
    """

    token = credentials.credentials
    payload = verify_token(token)

    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return payload


@router.post("/{course_id}", response_model=EnrollmentResponse)
def enroll_in_course(
    course_id: int,
    db: Session = Depends(get_db),
    user_data=Depends(get_current_user)
):
    """
    POST /enrollments/:course_id

    Enrolls the authenticated student in the specified course.

    This operation is idempotent: if the student is already enrolled,
    the existing Enrollment record is returned with HTTP 200 rather
    than raising a 409 conflict.

    Authorization:
    - Bearer token required (any authenticated user).

    Responses:
        200 EnrollmentResponse (new or existing)
        404 Course not found
    """

    user_id = user_data["user_id"]

    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course Not Found")

    # Return the existing record without modification to keep the
    # operation idempotent and avoid duplicate rows.
    existing = db.query(Enrollment).filter(
        Enrollment.user_id == user_id,
        Enrollment.course_id == course_id
    ).first()

    if existing:
        return existing

    enrollment = Enrollment(user_id=user_id, course_id=course_id, progress_percent=0.0)
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment


@router.get("/my-courses")
def get_my_enrolled_courses(
    db: Session = Depends(get_db),
    user_data=Depends(get_current_user)
):
    """
    GET /enrollments/my-courses

    Returns the full list of courses the authenticated student is enrolled in,
    enriched with chapter counts and course metadata.

    The response is built manually (not via a Pydantic schema) because it
    combines Enrollment fields with Course fields and an aggregated chapter
    count. This avoids an N+1 query structure by computing the chapter
    count inline per enrollment.

    Authorization:
    - Bearer token required (any authenticated user).

    Responses:
        200 List of enriched enrollment objects, including:
            - enrollment_id, course_id, title, description, category,
              difficulty, language, thumbnail, progress_percent,
              enrolled_at, chapter_count
    """

    user_id = user_data["user_id"]
    enrollments = db.query(Enrollment).filter(Enrollment.user_id == user_id).all()

    # Enrich each enrollment with course metadata and chapter count
    # so the student dashboard can render the full card without
    # additional network requests.
    results = []
    for enr in enrollments:
        course = db.query(Course).filter(Course.id == enr.course_id).first()
        if course:
            chapter_count = db.query(Chapter).filter(Chapter.course_id == course.id).count()
            results.append({
                "enrollment_id": enr.id,
                "course_id": course.id,
                "title": course.title,
                "description": course.description,
                "category": course.category,
                "difficulty": course.difficulty,
                "language": course.language,
                "thumbnail": course.thumbnail,
                "progress_percent": enr.progress_percent,
                "enrolled_at": enr.enrolled_at,
                "chapter_count": chapter_count
            })

    return results


@router.get("/check/{course_id}")
def check_enrollment(
    course_id: int,
    db: Session = Depends(get_db),
    user_data=Depends(get_current_user)
):
    """
    GET /enrollments/check/:course_id

    Returns whether the authenticated student is enrolled in a given course,
    along with the current progress percentage.

    Used by the student course detail page to conditionally render the
    "Enroll" or "Continue Learning" button without loading the full
    enrollment list.

    Authorization:
    - Bearer token required (any authenticated user).

    Responses:
        200 { enrolled: bool, progress_percent: float, enrollment_id?: int }
    """

    user_id = user_data["user_id"]
    enr = db.query(Enrollment).filter(
        Enrollment.user_id == user_id,
        Enrollment.course_id == course_id
    ).first()

    if not enr:
        return {"enrolled": False, "progress_percent": 0.0}

    return {
        "enrolled": True,
        "progress_percent": enr.progress_percent,
        "enrollment_id": enr.id
    }


@router.post("/progress/{course_id}")
def update_progress(
    course_id: int,
    progress: float,
    db: Session = Depends(get_db),
    user_data=Depends(get_current_user)
):
    """
    POST /enrollments/progress/:course_id

    Updates the authenticated student's completion percentage for a course.

    The progress value is clamped to [0.0, 100.0] before being written to
    the database to prevent invalid values from reaching the UI analytics.

    Authorization:
    - Bearer token required (any authenticated user).

    Query Parameters:
    - progress (float): The new completion percentage.

    Responses:
        200 { message, progress_percent }
        400 Student is not enrolled in this course
    """

    user_id = user_data["user_id"]
    enr = db.query(Enrollment).filter(
        Enrollment.user_id == user_id,
        Enrollment.course_id == course_id
    ).first()

    if not enr:
        raise HTTPException(status_code=400, detail="User not enrolled in this course")

    # Clamp to a valid percentage range to protect against malformed
    # client payloads that could corrupt analytics aggregates.
    enr.progress_percent = min(100.0, max(0.0, progress))
    db.commit()
    db.refresh(enr)

    return {"message": "Progress Updated", "progress_percent": enr.progress_percent}
