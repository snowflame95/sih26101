from fastapi import APIRouter, Depends, HTTPException, Security, status
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
from app.services.activity_service import log_activity
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
    Public registration endpoint.

    All users registering through this endpoint are created
    with the learner role.
    """

    try:
        user = create_user(
            db,
            user_data,
        )

        # Record the registration after the user exists.
        log_activity(
            db,
            actor_user_id=user.id,
            target_user_id=user.id,
            action="user_registered",
            description=(
                f"New learner account registered: "
                f"{user.email}."
            ),
            entity_type="user",
            entity_id=user.id,
            details={
                "role": user.role,
            },
        )

        return user

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


# ============================================================
# PRIVILEGED USER PROVISIONING
# ============================================================

@router.post(
    "/users",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_privileged_account(
    user_data: AdminUserCreate,
    db: Session = Depends(get_db),
    _: str = Security(
        verify_special_registration_key
    ),
):
    """
    Create privileged users such as trainer or admin.

    This endpoint is protected by the private
    X-Special-Registration-Key header.

    The special registration key must NEVER be exposed
    in the frontend.
    """

    try:
        user = create_privileged_user(
            db,
            user_data,
        )

        log_activity(
            db,
            actor_user_id=user.id,
            target_user_id=user.id,
            action="privileged_user_created",
            description=(
                f"Privileged account created: "
                f"{user.email} ({user.role})."
            ),
            entity_type="user",
            entity_id=user.id,
            details={
                "role": user.role,
            },
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
    Authenticate a user and return a JWT access token.
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
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    access_token = create_access_token(
        subject=str(user.id)
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
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
    Return the currently authenticated user's information.

    The role is always read from the database through the
    authenticated User object.
    """

    return current_user


# ============================================================
# ADMIN — UPDATE USER ROLE
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
    """
    Update another user's role.

    Only administrators can access this endpoint.

    Administrators cannot change their own role.
    """

    # --------------------------------------------------------
    # Prevent administrator self-demotion.
    # --------------------------------------------------------

    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Administrators cannot change "
                "their own role"
            ),
        )

    try:
        user = update_user_role(
            db,
            user_id,
            role_data.role,
        )

        # ----------------------------------------------------
        # Record role change.
        # ----------------------------------------------------

        log_activity(
            db,
            actor_user_id=current_user.id,
            target_user_id=user.id,
            action="user_role_changed",
            description=(
                f"Administrator "
                f"{current_user.email} changed "
                f"{user.email}'s role to "
                f"{user.role}."
            ),
            entity_type="user",
            entity_id=user.id,
            details={
                "previous_role": None,
                "new_role": user.role,
            },
        )

        return user

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc