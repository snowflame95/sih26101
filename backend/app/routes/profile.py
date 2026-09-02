from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db
from app.db.models.user import User
from app.schemas.profile import (
    ProfileCreate,
    ProfileResponse,
    ProfileUpdate,
)
from app.services.profile_service import (
    create_profile,
    delete_profile,
    get_profile_by_user_id,
    update_profile,
)


router = APIRouter(
    prefix="/api/profile",
    tags=["Profile"],
)


@router.post(
    "",
    response_model=ProfileResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_user_profile(
    profile_data: ProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing_profile = get_profile_by_user_id(
        db,
        current_user.id,
    )

    if existing_profile:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Profile already exists",
        )

    try:
        return create_profile(
            db,
            current_user.id,
            profile_data,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.get(
    "",
    response_model=ProfileResponse,
)
def get_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = get_profile_by_user_id(
        db,
        current_user.id,
    )

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found",
        )

    return profile


@router.put(
    "",
    response_model=ProfileResponse,
)
def update_user_profile(
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = get_profile_by_user_id(
        db,
        current_user.id,
    )

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found",
        )

    return update_profile(
        db,
        profile,
        profile_data,
    )


@router.delete(
    "",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = get_profile_by_user_id(
        db,
        current_user.id,
    )

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found",
        )

    delete_profile(
        db,
        profile,
    )

    return None