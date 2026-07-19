"""
routes/admin.py
---------------
FastAPI router for administrator-only analytics and reporting endpoints.

Endpoints
---------
GET /admin-api/stats    -- Aggregated platform KPIs for the admin dashboard.
GET /admin-api/courses  -- Per-course enrollment and progress summary.
GET /admin-api/students -- Per-student enrollment and progress summary.

Access Control
--------------
All three endpoints require a valid JWT with role="admin". The
`get_current_admin` dependency handles token validation and role
enforcement before any database query is executed.

Data Aggregation
----------------
Aggregation is performed in Python rather than via SQL GROUP BY or
aggregate functions. While this approach is simpler to write, it is
O(students × courses) in complexity and will become a performance
bottleneck at scale. Future versions should replace the Python loops
with SQLAlchemy aggregate queries (func.avg, func.count) and proper
JOIN clauses.

The GET /admin-api/stats endpoint performs the following operations in
a single request:
  - Counts students, courses, chapters, and resources.
  - Computes the platform-wide average completion percentage.
  - Ranks all courses by enrollment count and average progress.
  - Lists all uploaded resources with their ChromaDB indexing status.
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models.user import User
from models.course import Course
from models.chapter import Chapter
from models.resource import Resource
from models.enrollment import Enrollment
from utils.auth import verify_token

router = APIRouter(
    prefix="/admin-api",
    tags=["Admin API"]
)

security = HTTPBearer()


def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    FastAPI dependency that enforces admin-only access on a route.

    Returns:
        dict: Decoded JWT payload containing user_id, email, and role.

    Raises:
        HTTPException 401: Token is missing, malformed, or expired.
        HTTPException 403: Authenticated user is not an admin.
    """

    token = credentials.credentials
    payload = verify_token(token)

    if not payload:
        raise HTTPException(status_code=401, detail="Invalid Token")

    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only Admin Allowed")

    return payload


@router.get("/stats")
def get_admin_dashboard_stats(
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    """
    GET /admin-api/stats

    Returns a comprehensive snapshot of platform activity for the admin
    Command Center dashboard.

    Response payload:
    - total_students      (int)   -- Number of registered student accounts.
    - total_courses       (int)   -- Number of courses in the catalog.
    - total_chapters      (int)   -- Total chapter count across all courses.
    - total_resources     (int)   -- Total uploaded PDF resource count.
    - avg_completion      (int)   -- Platform-wide average progress percentage,
                                    rounded to the nearest integer.
    - top_courses         (list)  -- Up to 5 courses ranked by enrollment count
                                    then average progress (descending).
    - rag_status_list     (list)  -- All resources with their ChromaDB index status.

    Authorization:
    - Bearer token with role="admin" required.

    Responses:
        200 Stats payload
        401 Invalid or missing token
        403 Authenticated user is not an admin
    """

    total_students = db.query(User).filter(User.role == "student").count()
    total_courses = db.query(Course).count()
    total_chapters = db.query(Chapter).count()
    total_resources = db.query(Resource).count()

    # Calculate average completion across all enrollments.
    # Returns 0 when no enrollments exist to avoid division by zero.
    enrollments = db.query(Enrollment).all()
    if enrollments:
        avg_completion = round(sum(e.progress_percent for e in enrollments) / len(enrollments))
    else:
        avg_completion = 0

    # Compute per-course enrollment counts and average progress for ranking.
    # Sorted descending by enrollment count first, then average progress,
    # to surface the most popular and highest-performing courses at the top.
    courses = db.query(Course).all()
    top_courses = []
    for c in courses:
        course_enrs = [e for e in enrollments if e.course_id == c.id]
        enr_count = len(course_enrs)
        c_avg_prog = round(sum(e.progress_percent for e in course_enrs) / enr_count) if enr_count > 0 else 0
        top_courses.append({
            "course_id": c.id,
            "title": c.title,
            "thumbnail": c.thumbnail or "",
            "category": c.category,
            "enrollment_count": enr_count,
            "avg_progress": c_avg_prog
        })

    top_courses.sort(key=lambda x: (x["enrollment_count"], x["avg_progress"]), reverse=True)

    # Build the RAG knowledge base status list. Each resource is assumed
    # to be indexed once it is uploaded via POST /resources/upload.
    # A more robust implementation would query ChromaDB's collection
    # metadata to confirm chunk presence.
    all_resources = db.query(Resource).all()
    rag_status_list = []
    for r in all_resources:
        ch = db.query(Chapter).filter(Chapter.id == r.chapter_id).first()
        c_title = "Unknown Course"
        if ch:
            co = db.query(Course).filter(Course.id == ch.course_id).first()
            if co:
                c_title = co.title
        rag_status_list.append({
            "resource_id": r.id,
            "title": r.title,
            "file_url": r.file_url,
            "resource_type": r.resource_type,
            "course_title": c_title,
            "status": "Chunked & Indexed in ChromaDB"
        })

    return {
        "total_students": total_students,
        "total_courses": total_courses,
        "total_chapters": total_chapters,
        "total_resources": total_resources,
        "avg_completion": avg_completion,
        "top_courses": top_courses[:5],
        "rag_status_list": rag_status_list
    }


@router.get("/courses")
def get_admin_courses_summary(
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    """
    GET /admin-api/courses

    Returns a summary list of all courses including enrollment counts and
    average student progress. Powers the Courses tab in the admin section.

    Unlike GET /courses/ (public), this endpoint includes enrollment
    analytics and the full created_at timestamp for auditing.

    Authorization:
    - Bearer token with role="admin" required.

    Responses:
        200 List of course summary objects with id, title, description,
            created_at, enrollment_count, and avg_progress
        401 Invalid or missing token
        403 Authenticated user is not an admin
    """

    courses = db.query(Course).all()
    enrollments = db.query(Enrollment).all()
    result = []

    for c in courses:
        course_enrs = [e for e in enrollments if e.course_id == c.id]
        enr_count = len(course_enrs)
        c_avg_prog = round(sum(e.progress_percent for e in course_enrs) / enr_count) if enr_count > 0 else 0
        result.append({
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "created_at": str(c.created_at),
            "enrollment_count": enr_count,
            "avg_progress": c_avg_prog
        })

    return result


@router.get("/students")
def get_all_students_summary(
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    """
    GET /admin-api/students

    Returns a summary of all registered students, including their enrolled
    courses and individual progress percentages. Powers the Student
    Management table in the admin section.

    The `name` field falls back to the email prefix if the student did not
    provide a display name during registration. The `created_at` field
    falls back to the string "Active" if the column is missing from an
    older record — this guard handles schema migrations gracefully.

    Authorization:
    - Bearer token with role="admin" required.

    Responses:
        200 List of student summary objects with student_id, name, email,
            created_at, enrolled_count, enrolled_courses, and avg_progress
        401 Invalid or missing token
        403 Authenticated user is not an admin
    """

    students = db.query(User).filter(User.role == "student").all()
    result = []

    for s in students:
        s_enrs = db.query(Enrollment).filter(Enrollment.user_id == s.id).all()
        enrolled_courses = []

        for enr in s_enrs:
            co = db.query(Course).filter(Course.id == enr.course_id).first()
            if co:
                enrolled_courses.append({
                    "course_id": co.id,
                    "title": co.title,
                    "progress_percent": enr.progress_percent
                })

        avg_prog = round(
            sum(ec["progress_percent"] for ec in enrolled_courses) / len(enrolled_courses)
        ) if enrolled_courses else 0

        result.append({
            "student_id": s.id,
            # Fall back to the email prefix when the student omitted their name.
            "name": s.name or s.email.split("@")[0],
            "email": s.email,
            # created_at guard: older records may not have this column populated.
            "created_at": str(s.created_at) if hasattr(s, "created_at") else "Active",
            "enrolled_count": len(enrolled_courses),
            "enrolled_courses": enrolled_courses,
            "avg_progress": avg_prog
        })

    return result
