from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.roles import UserRole
from app.core.security import hash_password, verify_password
from app.db.models.user import User
from app.schemas.user import (
    AdminUserCreate,
    UserCreate,
)


def get_user_by_email(
    db: Session,
    email: str,
) -> User | None:
    return db.scalar(
        select(User).where(User.email == email)
    )


def get_user_by_id(
    db: Session,
    user_id: int,
) -> User | None:
    return db.scalar(
        select(User).where(User.id == user_id)
    )


def create_user(
    db: Session,
    user_data: UserCreate,
) -> User:
    """
    Public registration.

    Every account created through the public registration
    flow is always a learner.
    """

    existing_user = get_user_by_email(
        db,
        user_data.email,
    )

    if existing_user:
        raise ValueError(
            "User with this email already exists"
        )

    user = User(
        email=user_data.email,
        hashed_password=hash_password(
            user_data.password
        ),
        role=UserRole.LEARNER.value,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def create_privileged_user(
    db: Session,
    user_data: AdminUserCreate,
) -> User:
    """
    Protected backend provisioning.

    Only trainer and admin accounts can be created here.
    """

    if user_data.role not in {
        UserRole.TRAINER,
        UserRole.ADMIN,
    }:
        raise ValueError(
            "Privileged registration only supports trainer or admin roles"
        )

    existing_user = get_user_by_email(
        db,
        user_data.email,
    )

    if existing_user:
        raise ValueError(
            "User with this email already exists"
        )

    user = User(
        email=user_data.email,
        hashed_password=hash_password(
            user_data.password
        ),
        role=user_data.role.value,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def update_user_role(
    db: Session,
    user_id: int,
    role: UserRole,
) -> User:
    user = get_user_by_id(
        db,
        user_id,
    )

    if user is None:
        raise ValueError(
            "User not found"
        )

    user.role = role.value

    db.commit()
    db.refresh(user)

    return user


def authenticate_user(
    db: Session,
    email: str,
    password: str,
) -> User | None:

    user = get_user_by_email(
        db,
        email,
    )

    if not user:
        return None

    if not verify_password(
        password,
        user.hashed_password,
    ):
        return None

    if not user.is_active:
        return None

    return user