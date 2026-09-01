from typing import Literal

from pydantic import EmailStr, Field

from app.schemas.base import CamelModel


class RegisterRequest(CamelModel):
    name: str = Field(min_length=3, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: Literal["student", "faculty"] = "student"
    level: str | None = None


class LoginRequest(CamelModel):
    email: EmailStr
    password: str


class UserOut(CamelModel):
    id: str
    name: str
    email: str
    role: str


class TokenResponse(CamelModel):
    user: UserOut
    token: str
