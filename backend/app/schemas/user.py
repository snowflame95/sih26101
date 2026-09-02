from pydantic import BaseModel, EmailStr, Field

from app.core.roles import UserRole


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(
        min_length=8,
        max_length=128,
    )
    role: UserRole = UserRole.LEARNER


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: str
    is_active: bool

    model_config = {
        "from_attributes": True,
    }