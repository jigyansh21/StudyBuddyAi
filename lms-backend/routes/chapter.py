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