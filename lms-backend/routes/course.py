"""
routes/course.py
----------------
FastAPI router for course CRUD operations.

Endpoints
---------
POST   /courses/            -- Create a new course (admin only).
GET    /courses/            -- Retrieve all published courses (public).
GET    /courses/:course_id  -- Retrieve a single course by ID (public).
PUT    /courses/:course_id  -- Replace all course fields (admin only).
DELETE /courses/:course_id  -- Remove a course and all child records (admin only).

Access Control
--------------
Write operations (POST, PUT, DELETE) require a valid JWT token whose
`role` claim equals "admin". Read operations (GET) are public and do
not require authentication, enabling the landing page and student
catalog to display courses without a login prompt.

The `get_current_admin` dependency extracts and validates the Bearer
token on every admin-restricted route. It raises HTTP 401 for invalid
tokens and HTTP 403 for non-admin roles.

Cascade Behaviour
-----------------
Deleting a course via the ORM cascades to its Chapter records (via the
`chapters` backref). Chapter deletion in turn cascades to Resources
(via cascade="all, delete-orphan" on Chapter.resources). Physical PDF
files and ChromaDB chunks are NOT automatically cleaned up by the ORM
cascade; they must be removed separately for complete cleanup.
"""

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException

from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials,
)

from sqlalchemy.orm import Session

from database import get_db

from models.course import Course

from schemas.course import (
    CourseCreate,
    CourseUpdate,
    CourseResponse,
)

from utils.auth import verify_token


router = APIRouter(
    prefix="/courses",
    tags=["Courses"]
)

security = HTTPBearer()


def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    FastAPI dependency that enforces admin-only access on a route.

    Decodes the Bearer token from the Authorization header and verifies
    that the embedded role is "admin". Raises an exception before the
    route handler executes if either check fails.

    Returns:
        dict: The decoded JWT payload containing user_id, email, and role.

    Raises:
        HTTPException 401: Token is missing, malformed, or expired.
        HTTPException 403: Token is valid but belongs to a non-admin user.
    """

    token = credentials.credentials

    payload = verify_token(token)

    if not payload:

        raise HTTPException(
            status_code=401,
            detail="Invalid Token"
        )

    if payload["role"] != "admin":

        raise HTTPException(
            status_code=403,
            detail="Only Admin Allowed"
        )

    return payload


@router.post("/")
def create_course(
    request: CourseCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    """
    POST /courses/

    Creates a new course in the catalog.

    Only administrators may create courses. The new course is immediately
    visible in the public catalog upon creation.

    Authorization:
    - Bearer token with role="admin" required.

    Responses:
        200 Course created — returns course_id for subsequent operations
        401 Invalid or missing token
        403 Authenticated user is not an admin
    """

    course = Course(
        title=request.title,
        description=request.description,
        category=request.category,
        difficulty=request.difficulty,
        language=request.language,
        thumbnail=request.thumbnail,
        intro_video=request.intro_video,
        learning_outcomes=request.learning_outcomes,
    )

    db.add(course)

    db.commit()

    db.refresh(course)

    return {
        "message": "Course Created",
        "course_id": course.id
    }


@router.get(
    "/",
    response_model=list[CourseResponse]
)
def get_all_courses(
    db: Session = Depends(get_db)
):
    """
    GET /courses/

    Returns all courses in the catalog.

    This endpoint is intentionally public (no auth required) so that the
    landing page and student catalog can display available courses to
    unauthenticated visitors.

    Responses:
        200 List of CourseResponse objects (may be empty)
    """

    return db.query(Course).all()


@router.get(
    "/{course_id}",
    response_model=CourseResponse
)
def get_course(
    course_id: int,
    db: Session = Depends(get_db)
):
    """
    GET /courses/:course_id

    Returns the details of a single course.

    Used by both the admin course management page and the student
    course detail view to display full course metadata.

    Responses:
        200 CourseResponse object
        404 Course not found
    """

    course = (
        db.query(Course)
        .filter(Course.id == course_id)
        .first()
    )

    if not course:

        raise HTTPException(
            status_code=404,
            detail="Course Not Found"
        )

    return course


@router.put("/{course_id}")
def update_course(
    course_id: int,
    request: CourseUpdate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    """
    PUT /courses/:course_id

    Replaces all fields of an existing course.

    This is a full replacement (PUT semantics), not a partial update.
    All fields from CourseUpdate must be provided; omitted optional
    fields (thumbnail, intro_video, learning_outcomes) are set to None.

    Authorization:
    - Bearer token with role="admin" required.

    Responses:
        200 Course updated
        401 Invalid or missing token
        403 Authenticated user is not an admin
        404 Course not found
    """

    course = (
        db.query(Course)
        .filter(Course.id == course_id)
        .first()
    )

    if not course:

        raise HTTPException(
            status_code=404,
            detail="Course Not Found"
        )

    course.title = request.title
    course.description = request.description
    course.category = request.category
    course.difficulty = request.difficulty
    course.language = request.language
    course.thumbnail = request.thumbnail
    course.intro_video = request.intro_video
    course.learning_outcomes = request.learning_outcomes

    db.commit()
    db.refresh(course)

    return {
        "message": "Course Updated"
    }


@router.delete("/{course_id}")
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    """
    DELETE /courses/:course_id

    Permanently removes a course from the platform.

    Warning: Deleting a course cascades to its Chapters and, through
    Chapter's ORM cascade, to its associated Resources. Physical PDF
    files on disk and ChromaDB vector chunks are NOT removed by this
    operation and must be cleaned up separately to avoid orphaned data.

    Authorization:
    - Bearer token with role="admin" required.

    Responses:
        200 Course deleted
        401 Invalid or missing token
        403 Authenticated user is not an admin
        404 Course not found
    """

    course = (
        db.query(Course)
        .filter(Course.id == course_id)
        .first()
    )

    if not course:

        raise HTTPException(
            status_code=404,
            detail="Course Not Found"
        )

    db.delete(course)
    db.commit()

    return {
        "message": "Course Deleted"
    }