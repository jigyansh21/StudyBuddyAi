"""
models/enrollment.py
--------------------
ORM model representing a student's enrollment in a course.

Enrollment Model
================
An Enrollment record is created when a student registers for a course.
It serves as the join entity between the `users` and `courses` tables,
and additionally tracks the student's completion percentage, enabling
personalized progress analytics on both the student dashboard and the
admin reporting views.

Relationships
-------------
One Enrollment
  -> belongs to one User   (via user_id foreign key, backref="enrollments")
  -> belongs to one Course (via course_id foreign key, backref="enrollments")

Progress Semantics
------------------
`progress_percent` is a float in the range [0.0, 100.0]. The API layer
clamps any incoming value to this range before persisting it (see
routes/enrollment.py -> update_progress).

Idempotency
-----------
The enrollment endpoint returns the existing record if a student
attempts to enroll in a course they have already joined, so clients
do not need to guard against duplicate submissions.

Table: enrollments
"""

from sqlalchemy import Column, Integer, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class Enrollment(Base):

    __tablename__ = "enrollments"

    # Primary key. Auto-incremented by the database.
    id = Column(Integer, primary_key=True, index=True)

    # Foreign key to the student who enrolled.
    # Populated via the JWT token on the enrollment request.
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Foreign key to the course being enrolled in.
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)

    # Completion percentage in the range [0.0, 100.0].
    # Defaults to 0.0 at enrollment time; updated as the student
    # progresses through chapters via POST /enrollments/progress/:course_id.
    progress_percent = Column(Float, default=0.0)

    # UTC timestamp captured at the moment the enrollment was created.
    # Surfaced in the admin student report for auditing and sorting.
    enrolled_at = Column(DateTime, default=datetime.utcnow)

    # UTC timestamp refreshed automatically on every subsequent update.
    # Useful for identifying the most recently active enrollment.
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Provides access to the parent User object from an Enrollment instance.
    # Also populates User.enrollments as the back-reference collection.
    user = relationship("User", backref="enrollments")

    # Provides access to the parent Course object from an Enrollment instance.
    # Also populates Course.enrollments as the back-reference collection.
    course = relationship("Course", backref="enrollments")
