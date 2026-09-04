from datetime import datetime, timedelta, timezone

import jwt
from fastapi import (
    Depends,
    HTTPException,
    Security,
    status,
)
from fastapi.security import (
    APIKeyHeader,
    HTTPAuthorizationCredentials,
    HTTPBearer,
)
from pwdlib import PasswordHash
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.roles import SUPPORTED_ROLES
from app.db.database import get_db
from app.db.models.user import User


password_hash = PasswordHash.recommended()

bearer_scheme = HTTPBearer()

# Used only for special trainer/admin provisioning.
special_registration_key = APIKeyHeader(
    name="X-Special-Registration-Key",
    auto_error=False,
)


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(
    password: str,
    hashed_password: str,
) -> bool:
    return password_hash.verify(
        password,
        hashed_password,
    )


def create_access_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": subject,
        "exp": expire,
    }

    return jwt.encode(
        payload,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(
        bearer_scheme
    ),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate authentication credentials",
        headers={
            "WWW-Authenticate": "Bearer"
        },
    )

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )

        subject = payload.get("sub")

        if subject is None:
            raise credentials_exception

        user_id = int(subject)

    except (
        jwt.ExpiredSignatureError,
        jwt.InvalidTokenError,
        ValueError,
    ):
        raise credentials_exception from None

    user = db.scalar(
        select(User).where(User.id == user_id)
    )

    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    return user


def require_role(*allowed_roles: str):
    invalid_roles = (
        set(allowed_roles) - SUPPORTED_ROLES
    )

    if invalid_roles:
        raise ValueError(
            "Unsupported roles: "
            + ", ".join(sorted(invalid_roles))
        )

    def role_checker(
        current_user: User = Depends(
            get_current_user
        ),
    ) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "You do not have permission "
                    "to access this resource"
                ),
            )

        return current_user

    return role_checker


def verify_special_registration_key(
    provided_key: str | None = Security(
        special_registration_key
    ),
) -> str:
    if not provided_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Special registration key is required",
        )

    if provided_key != settings.SPECIAL_REGISTRATION_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid special registration key",
        )

    return provided_key