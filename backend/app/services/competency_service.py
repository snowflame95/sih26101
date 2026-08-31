from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.db.models.competency import Competency, UserCompetency
from app.schemas.competency import (
    CompetencyCreate,
    UserCompetencyCreate,
    UserCompetencyUpdate,
)


def get_all_competencies(
    db: Session,
) -> list[Competency]:
    return list(
        db.scalars(
            select(Competency).order_by(Competency.name)
        ).all()
    )


def get_competency_by_id(
    db: Session,
    competency_id: int,
) -> Competency | None:
    return db.scalar(
        select(Competency).where(
            Competency.id == competency_id
        )
    )


def create_competency(
    db: Session,
    competency_data: CompetencyCreate,
) -> Competency:
    existing_competency = db.scalar(
        select(Competency).where(
            Competency.name == competency_data.name
        )
    )

    if existing_competency:
        raise ValueError(
            "Competency with this name already exists"
        )

    competency = Competency(
        name=competency_data.name,
        category=competency_data.category,
        description=competency_data.description,
    )

    db.add(competency)
    db.commit()
    db.refresh(competency)

    return competency


def get_user_competencies(
    db: Session,
    user_id: int,
) -> list[UserCompetency]:
    return list(
        db.scalars(
            select(UserCompetency)
            .options(joinedload(UserCompetency.competency))
            .where(UserCompetency.user_id == user_id)
            .order_by(UserCompetency.id)
        ).all()
    )


def get_user_competency(
    db: Session,
    user_id: int,
    competency_id: int,
) -> UserCompetency | None:
    return db.scalar(
        select(UserCompetency)
        .where(
            UserCompetency.user_id == user_id,
            UserCompetency.competency_id == competency_id,
        )
    )


def add_user_competency(
    db: Session,
    user_id: int,
    competency_data: UserCompetencyCreate,
) -> UserCompetency:
    competency = get_competency_by_id(
        db,
        competency_data.competency_id,
    )

    if competency is None:
        raise ValueError("Competency not found")

    existing = get_user_competency(
        db,
        user_id,
        competency_data.competency_id,
    )

    if existing:
        raise ValueError(
            "User already has this competency"
        )

    user_competency = UserCompetency(
        user_id=user_id,
        competency_id=competency_data.competency_id,
        current_level=competency_data.current_level,
        required_level=competency_data.required_level,
    )

    db.add(user_competency)
    db.commit()
    db.refresh(user_competency)

    return user_competency


def update_user_competency(
    db: Session,
    user_competency: UserCompetency,
    competency_data: UserCompetencyUpdate,
) -> UserCompetency:
    update_data = competency_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(user_competency, field, value)

    db.commit()
    db.refresh(user_competency)

    return user_competency


def delete_user_competency(
    db: Session,
    user_competency: UserCompetency,
) -> None:
    db.delete(user_competency)
    db.commit()