from typing import Literal

from pydantic import BaseModel, EmailStr, Field

from app.core.roles import UserRole


class UserCreate(BaseModel):
    """
    Public registration payload.

    Role is intentionally NOT present.

    Every public registration creates a learner.
    """

    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128,
    )


class AdminUserCreate(BaseModel):
    """
    Special privileged registration payload.

    Only trainer/admin accounts can be created
    through the special registration endpoint.
    """

    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128,
    )

    role: Literal[
        UserRole.TRAINER,
        UserRole.ADMIN,
    ]


class UserLogin(BaseModel):
    email: EmailStr

    password: str


class UserRoleUpdate(BaseModel):
    role: UserRole


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