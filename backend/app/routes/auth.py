from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    get_current_user,
    require_role,
    verify_special_registration_key,
)
from app.db.database import get_db
from app.db.models.user import User
from app.schemas.user import (
    AdminUserCreate,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
    UserRoleUpdate,
)
from app.services.auth_service import (
    authenticate_user,
    create_privileged_user,
    create_user,
    update_user_role,
)


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


# ============================================================
# PUBLIC LEARNER REGISTRATION
# ============================================================

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    user_data: UserCreate,
    db: Session = Depends(get_db),
):
    """
    Public registration.

    This endpoint ALWAYS creates a learner.
    Role cannot be selected here.
    """

    try:
        user = create_user(
            db,
            user_data,
        )

        return user

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


# ============================================================
# SPECIAL TRAINER / ADMIN REGISTRATION
# ============================================================

@router.post(
    "/users",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_privileged_account(
    user_data: AdminUserCreate,
    db: Session = Depends(get_db),
    _registration_key: str = Depends(
        verify_special_registration_key
    ),
):
    """
    Special privileged registration.

    Requires the special registration key.

    Allowed roles:
    - trainer
    - admin

    Learner accounts must use /register.
    """

    try:
        user = create_privileged_user(
            db,
            user_data,
        )

        return user

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


# ============================================================
# LOGIN
# ============================================================

@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    user_data: UserLogin,
    db: Session = Depends(get_db),
):
    """
    Login works for all active user roles.

    The actual role is stored in the database.
    """

    user = authenticate_user(
        db,
        user_data.email,
        user_data.password,
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token(
        str(user.id)
    )

    return TokenResponse(
        access_token=access_token,
    )


# ============================================================
# CURRENT USER
# ============================================================

@router.get(
    "/me",
    response_model=UserResponse,
)
def get_me(
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Returns the actual authenticated user
    including the database role.
    """

    return current_user


# ============================================================
# ADMIN ROLE MANAGEMENT
# ============================================================

@router.patch(
    "/users/{user_id}/role",
    response_model=UserResponse,
)
def update_role(
    user_id: int,
    role_data: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("admin")
    ),
):
    try:
        user = update_user_role(
            db,
            user_id,
            role_data.role,
        )

        return user

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc