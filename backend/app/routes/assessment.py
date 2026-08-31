from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db
from app.db.models.user import User
from app.schemas.assessment import (
    AssessmentCreate,
    AssessmentQuestionResponse,
    AssessmentResponse,
    AssessmentResultResponse,
    AssessmentSubmitRequest,
)
from app.services.assessment_service import (
    create_assessment,
    get_assessment,
    get_assessment_questions,
    submit_assessment,
)


router = APIRouter(
    prefix="/api/assessments",
    tags=["Assessments"],
)


@router.post(
    "/",
    response_model=AssessmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_new_assessment(
    assessment_data: AssessmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in {"admin", "trainer"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or trainer can create assessments",
        )

    return create_assessment(
        db,
        assessment_data,
    )


@router.get(
    "/{assessment_id}",
    response_model=AssessmentResponse,
)
def get_single_assessment(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assessment = get_assessment(
        db,
        assessment_id,
    )

    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found",
        )

    questions = get_assessment_questions(
        db,
        assessment_id,
    )

    return AssessmentResponse(
        id=assessment.id,
        title=assessment.title,
        description=assessment.description,
        is_active=assessment.is_active,
        created_at=assessment.created_at,
        questions=[
            AssessmentQuestionResponse(
                id=question.id,
                competency_id=question.competency_id,
                question_text=question.question_text,
                options=question.options,
                difficulty=question.difficulty,
                explanation=question.explanation,
            )
            for question in questions
        ],
    )


@router.post(
    "/{assessment_id}/submit",
    response_model=AssessmentResultResponse,
)
def submit_user_assessment(
    assessment_id: int,
    submission: AssessmentSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        attempt = submit_assessment(
            db,
            current_user.id,
            assessment_id,
            submission,
        )

        return AssessmentResultResponse(
            attempt_id=attempt.id,
            assessment_id=attempt.assessment_id,
            score=attempt.score,
            total_questions=attempt.total_questions,
            percentage=attempt.percentage,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc