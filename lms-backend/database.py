"""
database.py
-----------
Configures the SQLAlchemy database engine, session factory, and declarative base
used across the entire application.

All ORM models inherit from `Base`. All route handlers receive a database session
via the `get_db` dependency, which is injected through FastAPI's DI system.

The session is closed in a `finally` block to guarantee connection release
regardless of whether the request succeeds or raises an exception.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# PostgreSQL connection string. In production this must be sourced from
# an environment variable rather than being hardcoded.
DATABASE_URL = "postgresql://postgres:InternDB1@localhost:5432/lms_db"

# The engine is the low-level connection pool to PostgreSQL.
engine = create_engine(DATABASE_URL)

# SessionLocal is a factory for individual database sessions.
# autocommit=False ensures changes are only persisted on explicit db.commit().
# autoflush=False prevents SQLAlchemy from issuing premature SQL before commit.
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Shared declarative base that all ORM models must inherit from.
# Required by SQLAlchemy to track model metadata and generate DDL.
Base = declarative_base()


def get_db():
    """
    FastAPI dependency that yields a database session per HTTP request.

    The session is automatically closed after the request completes,
    regardless of success or failure, to prevent connection leaks.

    Yields:
        Session: An active SQLAlchemy database session.
    """
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()