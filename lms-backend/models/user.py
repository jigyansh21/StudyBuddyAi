"""
models/user.py
--------------
ORM model representing an authenticated platform user.

User Model
==========
Stores identity and credential information for all platform participants.
The `role` field determines access level and governs which API routes
a user may access:

  - "student" (default): Can enroll in courses, access AI Tutor, and
    track personal progress.
  - "admin": Has full CRUD access to courses, chapters, resources, and
    can view all student analytics.

Relationships
-------------
One User
  -> many Enrollments (via Enrollment.user_id)

The inverse relationship is populated automatically by SQLAlchemy via the
`backref="enrollments"` defined on the Enrollment model.

Table: users
"""

from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime

from database import Base


class User(Base):

    __tablename__ = "users"

    # Primary key. Auto-incremented by the database.
    id = Column(Integer, primary_key=True, index=True)

    # Full display name of the user, shown in the dashboard and sidebar.
    name = Column(String, nullable=False)

    # Unique email address used as the login identifier.
    email = Column(String, unique=True, nullable=False)

    # bcrypt-hashed password. The plaintext password is never persisted.
    password = Column(String, nullable=False)

    # Access control level. Defaults to "student" on registration.
    # Must be manually set to "admin" for administrative accounts.
    role = Column(String, default="student")

    # UTC timestamp of account creation. Used in the admin student report.
    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )