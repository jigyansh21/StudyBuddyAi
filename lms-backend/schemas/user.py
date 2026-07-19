"""
schemas/user.py
---------------
Pydantic request schemas for the authentication endpoints.

These models govern the JSON body shape that FastAPI validates before
a request reaches the route handler. They do NOT mirror the ORM User
model column-for-column — only the fields required at the HTTP boundary
are declared here.

Email validation is delegated to Pydantic's `EmailStr` type, which
enforces RFC 5322 format and normalises the address to lowercase,
ensuring consistent database lookups.
"""

from pydantic import BaseModel, EmailStr


class UserRegister(BaseModel):
    """
    Request body for POST /auth/register.

    All three fields are required. The password is accepted as plaintext
    and must be hashed (bcrypt) before being written to the database.
    """

    name: str

    # Used as the primary login identifier; validated against RFC 5322.
    email: EmailStr

    # Plaintext password supplied by the user.
    # Never persisted — the route handler hashes it immediately.
    password: str


class UserLogin(BaseModel):
    """
    Request body for POST /auth/login.

    Only the credential fields are required; the name is already stored
    and is returned as part of the JWT response payload.
    """

    email: EmailStr

    password: str