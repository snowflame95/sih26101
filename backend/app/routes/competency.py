from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db
from app.db.models.user import User
from app.schemas.competency import (
    CompetencyCreate,
    CompetencyResponse,
    UserCompetencyCreate,
    UserCompetencyResponse,
    UserCompetencyUpdate,
)
from app.services.competency_service import (
    add_user_competency,
    create_competency,
    delete_user_competency,
    get_all_competencies,
    get_user_competencies,
    get_user_competency,
    update_user_competency,
)


router = APIRouter(
    prefix="/api/competencies",
    tags=["Competencies"],
)


@router.get(
    "",
    response_model=list[CompetencyResponse],
)
def list_competencies(
    db: Session = Depends(get_db),
):
    return get_all_competencies(db)


@router.post(
    "",
    response_model=CompetencyResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_competency(
    competency_data: CompetencyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return create_competency(
            db,
            competency_data,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.get(
    "/me",
    response_model=list[UserCompetencyResponse],
)
def list_my_competencies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_user_competencies(
        db,
        current_user.id,
    )


@router.post(
    "/me",
    response_model=UserCompetencyResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_my_competency(
    competency_data: UserCompetencyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return add_user_competency(
            db,
            current_user.id,
            competency_data,
        )

    except ValueError as exc:
        message = str(exc)

        if message == "Competency not found":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=message,
            ) from exc

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=message,
        ) from exc


@router.put(
    "/me/{competency_id}",
    response_model=UserCompetencyResponse,
)
def update_my_competency(
    competency_id: int,
    competency_data: UserCompetencyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_competency = get_user_competency(
        db,
        current_user.id,
        competency_id,
    )

    if user_competency is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User competency not found",
        )

    return update_user_competency(
        db,
        user_competency,
        competency_data,
    )


@router.delete(
    "/me/{competency_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_my_competency(
    competency_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_competency = get_user_competency(
        db,
        current_user.id,
        competency_id,
    )

    if user_competency is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User competency not found",
        )

    delete_user_competency(
        db,
        user_competency,
    )

    return None