from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.roles import UserRole
from app.core.security import hash_password, verify_password
from app.db.models.user import User
from app.schemas.user import UserCreate


def get_user_by_email(
    db: Session,
    email: str,
) -> User | None:
    return db.scalar(
        select(User).where(User.email == email)
    )


def create_user(
    db: Session,
    user_data: UserCreate,
) -> User:

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