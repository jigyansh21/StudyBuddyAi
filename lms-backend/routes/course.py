from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import Header

from sqlalchemy.orm import Session

from database import get_db

from models.course import Course

from schemas.course import CourseCreate
from schemas.course import CourseUpdate

from utils.auth import verify_token


router = APIRouter(
    prefix="/courses",
    tags=["Courses"]
)

def get_current_admin(
    authorization: str = Header(None)
):

    if not authorization:

        raise HTTPException(
            status_code=401,
            detail="Token Missing"
        )

    token = authorization.replace(
        "Bearer ",
        ""
    )

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
        description=request.description
    )

    db.add(course)

    db.commit()

    db.refresh(course)

    return {
        "message": "Course Created",
        "course_id": course.id
    }

@router.get("/")
def get_all_courses(
    db: Session = Depends(get_db)
):

    courses = db.query(
        Course
    ).all()

    return courses


@router.get("/{course_id}")
def get_course(
    course_id: int,
    db: Session = Depends(get_db)
):

    course = db.query(
        Course
    ).filter(
        Course.id == course_id
    ).first()

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

    course = db.query(
        Course
    ).filter(
        Course.id == course_id
    ).first()

    if not course:

        raise HTTPException(
            status_code=404,
            detail="Course Not Found"
        )

    course.title = request.title

    course.description = request.description

    db.commit()

    return {
        "message": "Course Updated"
    }

@router.delete("/{course_id}")
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):

    course = db.query(
        Course
    ).filter(
        Course.id == course_id
    ).first()

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

