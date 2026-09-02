"""POST /api/auth/register · POST /api/auth/login · GET /api/auth/me"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


def _user_out(u: User) -> UserOut:
    return UserOut(id=u.id, name=u.name, email=u.email, role=u.role)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    existing = db.scalar(select(User).where(User.email == body.email.lower()))
    if existing is not None:
        raise HTTPException(status_code=409, detail="An account with this email already exists. Try logging in.")
    user = User(
        name=body.name.strip(),
        email=body.email.lower(),
        hashed_password=hash_password(body.password),
        role=body.role,
        level=body.level,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return TokenResponse(user=_user_out(user), token=create_access_token(user.id, user.role))


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.scalar(select(User).where(User.email == body.email.lower()))
    if user is None or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    return TokenResponse(user=_user_out(user), token=create_access_token(user.id, user.role))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)) -> UserOut:
    return _user_out(user)
