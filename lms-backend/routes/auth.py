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

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post("/register")
def register(
    request: UserRegister,
    db: Session = Depends(get_db)
):

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

    user = db.query(User).filter(
        User.email == request.email
    ).first()

    if not user:

        raise HTTPException(
            status_code=400,
            detail="Invalid Email"
        )

    if not verify_password(
        request.password,
        user.password
    ):

        raise HTTPException(
            status_code=400,
            detail="Wrong Password"
        )

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
        "role": user.role
    }