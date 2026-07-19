"""
routes/auth.py
--------------
FastAPI router handling user registration, login, and token verification.

Endpoints
---------
POST /auth/register  -- Creates a new student account.
POST /auth/login     -- Authenticates credentials and returns a JWT.
GET  /auth/me        -- Resolves the authenticated user from a Bearer token.

Authentication Flow
-------------------
1. The client submits credentials to POST /auth/login.
2. The route validates the email/password pair against the database.
3. On success, a HS256-signed JWT is issued containing user_id, email,
   and role. The token expires after 24 hours.
4. Subsequent authenticated requests must include the token as a Bearer
   credential in the Authorization header.
5. GET /auth/me decodes the token and returns the live user record,
   enabling the frontend to refresh display names after login.

Security Notes
--------------
Passwords are never stored in plaintext. The hash_password utility
applies bcrypt hashing before insertion. verify_password uses bcrypt's
constant-time comparison to prevent timing attacks.
"""

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException

from sqlalchemy.orm import Session

from database import get_db

from models.user import User

from schemas.user import UserRegister
from schemas.user import UserLogin

from utils.auth import hash_password
from utils.auth import verify_password
from utils.auth import create_access_token
from utils.auth import verify_token
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post("/register")
def register(
    request: UserRegister,
    db: Session = Depends(get_db)
):
    """
    POST /auth/register

    Registers a new platform user with the "student" role.

    Validation:
    - name required
    - email required and must be a valid email format
    - password required

    Behaviour:
    - Rejects duplicate email addresses with HTTP 400.
    - Hashes the password with bcrypt before persisting.
    - The role defaults to "student"; admin accounts must be set manually.

    Responses:
        200 Registration successful
        400 Email already registered
    """

    # Prevent duplicate accounts. Email is used as the unique login identifier.
    existing_user = db.query(User).filter(
        User.email == request.email
    ).first()

    if existing_user:

        raise HTTPException(
            status_code=400,
            detail="User already registered"
        )

    new_user = User(
        name=request.name,
        email=request.email,
        # Store only the bcrypt hash; plaintext is discarded immediately.
        password=hash_password(request.password)
    )

    db.add(new_user)

    db.commit()

    db.refresh(new_user)

    return {
        "message": "User Registered Successfully"
    }


@router.post("/login")
def login(
    request: UserLogin,
    db: Session = Depends(get_db)
):
    """
    POST /auth/login

    Authenticates a user and returns a signed JWT access token.

    The response includes the token, token type, role, and basic
    profile fields so the frontend can initialise user state from
    a single request without a follow-up /auth/me call.

    Validation:
    - email required
    - password required

    Responses:
        200 Login successful — returns JWT payload
        400 Invalid email (user not found)
        400 Wrong password
    """

    # Look up the account by email first; avoids a password hash
    # computation for non-existent accounts.
    user = db.query(User).filter(
        User.email == request.email
    ).first()

    if not user:

        raise HTTPException(
            status_code=400,
            detail="Invalid Email"
        )

    # bcrypt's constant-time verify prevents timing-based credential inference.
    if not verify_password(
        request.password,
        user.password
    ):

        raise HTTPException(
            status_code=400,
            detail="Wrong Password"
        )

    # Embed role in the token payload so route guards can authorise
    # requests without an additional database round-trip.
    token = create_access_token(
        {
            "user_id": user.id,
            "email": user.email,
            "role": user.role
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "name": user.name,
        "email": user.email
    }


# Reusable HTTP Bearer scheme extractor shared by authenticated endpoints
# that need to identify the current user (e.g., GET /auth/me).
security = HTTPBearer()


@router.get("/me")
def get_me(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """
    GET /auth/me

    Returns the live profile of the authenticated user.

    Used by the student sidebar and header on mount to re-hydrate
    display names from the database, ensuring data remains accurate
    even if the JWT was issued before a name change.

    Authorization:
    - Bearer token required in the Authorization header.

    Responses:
        200 Returns user_id, name, email, and role
        401 Token is invalid or expired
        404 User record no longer exists (e.g., deleted after token issuance)
    """

    payload = verify_token(credentials.credentials)

    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    # Re-query the database to ensure the user still exists and
    # the name/role have not been changed since the token was issued.
    user = db.query(User).filter(User.id == payload["user_id"]).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "user_id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role
    }