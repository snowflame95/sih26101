from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.competency import Competency, UserCompetency
from app.db.models.learning import LearningModule, LearningProgress, LearningResource
from app.schemas.learning import (
    LearningModuleCreate,
    LearningModuleUpdate,
    LearningResourceCreate,
    LearningResourceUpdate,
    LearningProgressUpdate,
)


def get_learning_modules(
    db: Session,
    competency_id: int | None = None,
) -> list[LearningModule]:
    query = (
        select(LearningModule)
        .order_by(
            LearningModule.competency_id,
            LearningModule.module_order,
            LearningModule.id,
        )
    )

    if competency_id is not None:
        query = query.where(
            LearningModule.competency_id == competency_id
        )

    return list(db.scalars(query).all())


def get_learning_module(
    db: Session,
    module_id: int,
) -> LearningModule | None:
    return db.scalar(
        select(LearningModule).where(
            LearningModule.id == module_id
        )
    )


def create_learning_module(
    db: Session,
    module_data: LearningModuleCreate,
) -> LearningModule:

    competency = db.scalar(
        select(Competency).where(
            Competency.id == module_data.competency_id
        )
    )

    if competency is None:
        raise ValueError("Competency not found")

    module = LearningModule(
        competency_id=module_data.competency_id,
        title=module_data.title,
        description=module_data.description,
        difficulty=module_data.difficulty,
        estimated_hours=module_data.estimated_hours,
        module_order=module_data.module_order,
    )

    db.add(module)
    db.commit()
    db.refresh(module)

    return module


def update_learning_module(db: Session, module_id: int, module_data: LearningModuleUpdate) -> LearningModule:
    module = get_learning_module(db, module_id)
    if module is None:
        raise ValueError("Learning module not found")

    update_data = module_data.model_dump(exclude_unset=True)
    if "competency_id" in update_data and db.scalar(select(Competency).where(Competency.id == update_data["competency_id"])) is None:
        raise ValueError("Competency not found")

    for field, value in update_data.items():
        setattr(module, field, value)
    db.commit()
    db.refresh(module)
    return module


def delete_learning_module(db: Session, module_id: int) -> None:
    module = get_learning_module(db, module_id)
    if module is None:
        raise ValueError("Learning module not found")
    if db.scalar(select(LearningProgress.id).where(LearningProgress.learning_module_id == module_id)) is not None:
        raise ValueError("Learning module has learner progress and cannot be deleted")
    db.delete(module)
    db.commit()


def get_learning_resources(db: Session, module_id: int) -> list[LearningResource]:
    return list(db.scalars(select(LearningResource).where(LearningResource.learning_module_id == module_id).order_by(LearningResource.resource_order, LearningResource.id)).all())


def create_learning_resource(db: Session, module_id: int, resource_data: LearningResourceCreate) -> LearningResource:
    if get_learning_module(db, module_id) is None:
        raise ValueError("Learning module not found")
    resource = LearningResource(learning_module_id=module_id, **resource_data.model_dump())
    resource.resource_url = str(resource.resource_url)
    db.add(resource)
    db.commit()
    db.refresh(resource)
    return resource


def update_learning_resource(db: Session, resource_id: int, resource_data: LearningResourceUpdate) -> LearningResource:
    resource = db.get(LearningResource, resource_id)
    if resource is None:
        raise ValueError("Learning resource not found")
    for field, value in resource_data.model_dump(exclude_unset=True).items():
        setattr(resource, field, str(value) if field == "resource_url" else value)
    db.commit()
    db.refresh(resource)
    return resource


def delete_learning_resource(db: Session, resource_id: int) -> None:
    resource = db.get(LearningResource, resource_id)
    if resource is None:
        raise ValueError("Learning resource not found")
    db.delete(resource)
    db.commit()


def get_user_progress(
    db: Session,
    user_id: int,
    module_id: int,
) -> LearningProgress | None:
    return db.scalar(
        select(LearningProgress).where(
            LearningProgress.user_id == user_id,
            LearningProgress.learning_module_id == module_id,
        )
    )


def start_learning_progress(
    db: Session,
    user_id: int,
    module_id: int,
) -> LearningProgress:

    module = get_learning_module(
        db,
        module_id,
    )

    if module is None:
        raise ValueError("Learning module not found")

    existing_progress = get_user_progress(
        db,
        user_id,
        module_id,
    )

    if existing_progress is not None:
        return existing_progress

    now = datetime.now(timezone.utc)

    progress = LearningProgress(
        user_id=user_id,
        learning_module_id=module_id,
        status="in_progress",
        progress_percentage=0,
        started_at=now,
    )

    db.add(progress)
    db.commit()
    db.refresh(progress)

    return progress


def update_learning_progress(
    db: Session,
    user_id: int,
    module_id: int,
    progress_data: LearningProgressUpdate,
) -> LearningProgress:

    module = get_learning_module(
        db,
        module_id,
    )

    if module is None:
        raise ValueError("Learning module not found")

    progress = get_user_progress(
        db,
        user_id,
        module_id,
    )

    now = datetime.now(timezone.utc)

    if progress is None:
        progress = LearningProgress(
            user_id=user_id,
            learning_module_id=module_id,
            status=progress_data.status,
            progress_percentage=progress_data.progress_percentage,
        )

        db.add(progress)

    else:
        if progress.status == "completed":
            if (
                progress_data.status != "completed"
                or progress_data.progress_percentage != 100
            ):
                raise ValueError(
                    "Completed learning progress cannot be moved backwards"
                )

        progress.status = progress_data.status
        progress.progress_percentage = (
            progress_data.progress_percentage
        )

    # 100% always means completed.
    if progress.progress_percentage == 100:
        progress.status = "completed"

    # Completed always means 100%.
    if progress.status == "completed":
        progress.progress_percentage = 100

    # Starting/in-progress should have a start timestamp.
    if (
        progress.status == "in_progress"
        and progress.started_at is None
    ):
        progress.started_at = now

    # A completed module must have started_at and completed_at.
    if progress.status == "completed":
        if progress.started_at is None:
            progress.started_at = now

        if progress.completed_at is None:
            progress.completed_at = now

    else:
        progress.completed_at = None

    db.commit()
    db.refresh(progress)

    return progress


def get_my_learning_progress(
    db: Session,
    user_id: int,
) -> list[LearningProgress]:
    return list(
        db.scalars(
            select(LearningProgress)
            .where(
                LearningProgress.user_id == user_id
            )
            .order_by(
                LearningProgress.learning_module_id
            )
        ).all()
    )


def get_my_roadmap(
    db: Session,
    user_id: int,
) -> list[dict]:
    """
    Build a deterministic learner roadmap.

    Roadmap order:
    1. Learner competencies with the largest skill gap first.
    2. Learning modules within each competency follow module_order.
    3. Existing learner progress is included.
    """

    user_competencies = list(
        db.scalars(
            select(UserCompetency)
            .where(
                UserCompetency.user_id == user_id
            )
            .order_by(
                UserCompetency.id
            )
        ).all()
    )

    roadmap: list[dict] = []

    for user_competency in user_competencies:

        skill_gap = max(
            user_competency.required_level
            - user_competency.current_level,
            0,
        )

        modules = list(
            db.scalars(
                select(LearningModule)
                .where(
                    LearningModule.competency_id
                    == user_competency.competency_id
                )
                .order_by(
                    LearningModule.module_order,
                    LearningModule.id,
                )
            ).all()
        )

        module_items = []

        for module in modules:

            progress = get_user_progress(
                db,
                user_id,
                module.id,
            )

            module_items.append(
                {
                    "module": module,
                    "progress": progress,
                }
            )

        roadmap.append(
            {
                "competency": user_competency.competency,
                "current_level": user_competency.current_level,
                "required_level": user_competency.required_level,
                "skill_gap": skill_gap,
                "modules": module_items,
            }
        )

    roadmap.sort(
        key=lambda item: item["skill_gap"],
        reverse=True,
    )

    return roadmap