"""
routes/chapter.py
-----------------
FastAPI router for chapter CRUD operations within a course.

Endpoints
---------
POST   /chapters/:course_id          -- Add a chapter to a course (admin only).
GET    /chapters/course/:course_id   -- List all chapters of a course (public).
GET    /chapters/:chapter_id         -- Retrieve a single chapter by ID (public).
PUT    /chapters/:chapter_id         -- Replace all chapter fields (admin only).
DELETE /chapters/:chapter_id         -- Remove a chapter (admin only).

Access Control
--------------
Write operations require a JWT with role="admin". Read operations are
public to allow the student course detail view to load chapter data
without additional authentication overhead.

Chapter Ordering
----------------
`chapter_order` must be unique within a course. Both the create and
update routes guard against duplicate order values before committing.
This constraint is enforced at the application layer rather than with
a database unique index, which means concurrent requests could
theoretically bypass it. For correctness under concurrent load, a
unique composite index on (course_id, chapter_order) should be added
to the `chapters` table.

Cascade Behaviour
-----------------
Deleting a chapter removes it from the database. Because
`cascade="all, delete-orphan"` is defined on Chapter.resources in the
ORM, all child Resource records are deleted by SQLAlchemy automatically.
Physical PDF files and ChromaDB chunks are NOT cleaned up here; to
prevent orphaned files, delete resources individually via
DELETE /resources/:id first.
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

from models.chapter import Chapter
from models.course import Course

from schemas.chapter import (
    ChapterCreate,
    ChapterUpdate,
    ChapterResponse,
)

from utils.auth import verify_token


router = APIRouter(
    prefix="/chapters",
    tags=["Chapters"]
)

security = HTTPBearer()


def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    FastAPI dependency that enforces admin-only access on a route.

    Returns:
        dict: Decoded JWT payload with user_id, email, and role.

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


@router.post("/{course_id}")
def create_chapter(
    course_id: int,
    request: ChapterCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    """
    POST /chapters/:course_id

    Adds a new chapter to the specified course.

    Validates that the parent course exists and that no other chapter
    in the same course shares the requested chapter_order before
    creating the record.

    Authorization:
    - Bearer token with role="admin" required.

    Responses:
        200 Chapter created — returns chapter_id
        400 chapter_order already exists within this course
        401 Invalid or missing token
        403 Authenticated user is not an admin
        404 Parent course not found
    """

    # Confirm the parent course exists before creating the chapter to
    # provide a meaningful 404 rather than a foreign-key constraint error.
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

    # Guard against duplicate ordering within the same course to maintain
    # a clean sequential playback structure for students.
    existing = (
        db.query(Chapter)
        .filter(
            Chapter.course_id == course_id,
            Chapter.chapter_order == request.chapter_order
        )
        .first()
    )

    if existing:

        raise HTTPException(
            status_code=400,
            detail="Chapter Order Already Exists"
        )

    chapter = Chapter(
        course_id=course_id,
        title=request.title,
        description=request.description,
        video_url=request.video_url,
        pdf_url=request.pdf_url,
        chapter_order=request.chapter_order,
    )

    db.add(chapter)

    db.commit()

    db.refresh(chapter)

    return {
        "message": "Chapter Created",
        "chapter_id": chapter.id
    }


@router.get(
    "/course/{course_id}",
    response_model=list[ChapterResponse]
)
def get_course_chapters(
    course_id: int,
    db: Session = Depends(get_db)
):
    """
    GET /chapters/course/:course_id

    Returns all chapters for a course, ordered by chapter_order ascending.

    Used by the student course detail view to render the chapter list
    in the correct sequential order without client-side sorting.

    Responses:
        200 List of ChapterResponse objects (may be empty)
    """

    chapters = (
        db.query(Chapter)
        .filter(Chapter.course_id == course_id)
        .order_by(Chapter.chapter_order)
        .all()
    )

    return chapters


@router.get(
    "/{chapter_id}",
    response_model=ChapterResponse
)
def get_chapter(
    chapter_id: int,
    db: Session = Depends(get_db)
):
    """
    GET /chapters/:chapter_id

    Returns a single chapter by its primary key.

    Used to load chapter content (video URL, PDF URL, description) for
    the in-course chapter viewer.

    Responses:
        200 ChapterResponse object
        404 Chapter not found
    """

    chapter = (
        db.query(Chapter)
        .filter(Chapter.id == chapter_id)
        .first()
    )

    if not chapter:

        raise HTTPException(
            status_code=404,
            detail="Chapter Not Found"
        )

    return chapter


@router.put("/{chapter_id}")
def update_chapter(
    chapter_id: int,
    request: ChapterUpdate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    """
    PUT /chapters/:chapter_id

    Replaces all fields of an existing chapter.

    Validates that the new chapter_order is not already occupied by
    another chapter in the same course, excluding the chapter being
    updated.

    Authorization:
    - Bearer token with role="admin" required.

    Responses:
        200 Chapter updated
        400 Requested chapter_order is already taken in this course
        401 Invalid or missing token
        403 Authenticated user is not an admin
        404 Chapter not found
    """

    chapter = (
        db.query(Chapter)
        .filter(Chapter.id == chapter_id)
        .first()
    )

    if not chapter:

        raise HTTPException(
            status_code=404,
            detail="Chapter Not Found"
        )

    # Exclude the current chapter from the conflict check to allow
    # admins to re-save a chapter without changing its order.
    existing = (
        db.query(Chapter)
        .filter(
            Chapter.course_id == chapter.course_id,
            Chapter.chapter_order == request.chapter_order,
            Chapter.id != chapter.id
        )
        .first()
    )

    if existing:

        raise HTTPException(
            status_code=400,
            detail="Chapter Order Already Exists"
        )

    chapter.title = request.title
    chapter.description = request.description
    chapter.video_url = request.video_url
    chapter.pdf_url = request.pdf_url
    chapter.chapter_order = request.chapter_order

    db.commit()

    db.refresh(chapter)

    return {
        "message": "Chapter Updated"
    }


@router.delete("/{chapter_id}")
def delete_chapter(
    chapter_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    """
    DELETE /chapters/:chapter_id

    Permanently removes a chapter and all of its associated Resources.

    The ORM cascade (cascade="all, delete-orphan" on Chapter.resources)
    removes Resource database records automatically. Physical PDF files
    and ChromaDB vector chunks linked to those Resources are NOT cleaned
    up by this operation. To avoid orphaned data, delete individual
    resources via DELETE /resources/:id before deleting the chapter.

    Authorization:
    - Bearer token with role="admin" required.

    Responses:
        200 Chapter deleted
        401 Invalid or missing token
        403 Authenticated user is not an admin
        404 Chapter not found
    """

    chapter = (
        db.query(Chapter)
        .filter(Chapter.id == chapter_id)
        .first()
    )

    if not chapter:

        raise HTTPException(
            status_code=404,
            detail="Chapter Not Found"
        )

    db.delete(chapter)

    db.commit()

    return {
        "message": "Chapter Deleted"
    }