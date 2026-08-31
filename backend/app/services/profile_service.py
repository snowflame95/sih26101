from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.profile import Profile
from app.schemas.profile import ProfileCreate, ProfileUpdate


def get_profile_by_user_id(
    db: Session,
    user_id: int,
) -> Profile | None:
    return db.scalar(
        select(Profile).where(Profile.user_id == user_id)
    )


def create_profile(
    db: Session,
    user_id: int,
    profile_data: ProfileCreate,
) -> Profile:
    existing_profile = get_profile_by_user_id(db, user_id)

    if existing_profile:
        raise ValueError("Profile already exists for this user")

    profile = Profile(
        user_id=user_id,
        full_name=profile_data.full_name,
        designation=profile_data.designation,
        department=profile_data.department,
        experience_years=profile_data.experience_years,
        education=profile_data.education,
        previous_training=profile_data.previous_training,
    )

    db.add(profile)
    db.commit()
    db.refresh(profile)

    return profile


def update_profile(
    db: Session,
    profile: Profile,
    profile_data: ProfileUpdate,
) -> Profile:
    update_data = profile_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)

    return profile


def delete_profile(
    db: Session,
    profile: Profile,
) -> None:
    db.delete(profile)
    db.commit()