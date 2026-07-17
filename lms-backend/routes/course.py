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

    return db.query(Course).all()


@router.get(
    "/{course_id}",
    response_model=CourseResponse
)
def get_course(
    course_id: int,
    db: Session = Depends(get_db)
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

    return course


@router.put("/{course_id}")
def update_course(
    course_id: int,
    request: CourseUpdate,
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