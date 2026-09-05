from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from app.core.roles import CONTENT_MANAGER_ROLES
from app.core.security import get_current_user, require_role
from app.db.database import get_db
from app.db.models.assessment import Assessment
from app.db.models.user import User
from app.schemas.assessment import (
    AssessmentAnswerResponse,
    AssessmentAssignmentCreate,
    AssessmentAssignmentFeedback,
    AssessmentAssignmentResponse,
    AssessmentAuthoringQuestionResponse,
    AssessmentAuthoringResponse,
    AssessmentAttemptDetailResponse,
    AssessmentAttemptResponse,
    AssessmentCreate,
    AssessmentQuestionCreate,
    AssessmentQuestionUpdate,
    AssessmentListResponse,
    AssessmentQuestionResponse,
    AssessmentResponse,
    AssessmentResultResponse,
    AssessmentSubmitRequest,
    AssessmentUpdate,
)
from app.services.activity_service import log_activity
from app.services.assessment_service import (
    create_assessment,
    add_assessment_question,
    create_assignment,
    delete_assessment,
    delete_assessment_question,
    get_all_active_assessments,
    get_assignment_for_user,
    get_assignment_response,
    get_assessment,
    get_assessment_questions,
    get_manage_assessment,
    get_learner_assignments,
    get_review_assignments,
    get_attempt_answers,
    get_attempt_by_id,
    get_user_attempts,
    submit_assessment,
    review_assignment,
    update_assessment,
    update_assessment_question,
)


router = APIRouter(
    prefix="/api/assessments",
    tags=["Assessments"],
)


# ============================================================
# LIST AVAILABLE ASSESSMENTS
# ============================================================

@router.get(
    "",
    response_model=list[AssessmentListResponse],
)
def list_assessments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_all_active_assessments(db)


# ============================================================
# ASSIGN ASSESSMENT
# ============================================================

@router.post(
    "/assignments",
    response_model=AssessmentAssignmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def assign_assessment(
    assignment_data: AssessmentAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(*CONTENT_MANAGER_ROLES)
    ),
):
    try:
        assignment = create_assignment(
            db,
            current_user.id,
            assignment_data,
        )

        # ----------------------------------------------------
        # Record assessment assignment.
        # ----------------------------------------------------

        log_activity(
            db,
            actor_user_id=current_user.id,
            target_user_id=assignment.learner_id,
            action="assessment_assigned",
            description=(
                f"{current_user.email} assigned "
                f"assessment #{assignment.assessment_id} "
                f"to learner #{assignment.learner_id}."
            ),
            entity_type="assessment_assignment",
            entity_id=assignment.id,
            details={
                "assessment_id": assignment.assessment_id,
                "learner_id": assignment.learner_id,
                "assigned_by": current_user.id,
            },
        )

        return get_assignment_response(
            db,
            assignment,
        )

    except ValueError as exc:
        code = (
            status.HTTP_409_CONFLICT
            if "already assigned"
            in str(exc).lower()
            else status.HTTP_404_NOT_FOUND
        )

        raise HTTPException(
            status_code=code,
            detail=str(exc),
        ) from exc


# ============================================================
# LEARNER ASSIGNMENTS
# ============================================================

@router.get(
    "/assignments/my",
    response_model=list[AssessmentAssignmentResponse],
)
def list_my_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_learner_assignments(
        db,
        current_user.id,
    )


# ============================================================
# REVIEW ASSIGNMENTS
# ============================================================

@router.get(
    "/assignments/assigned",
    response_model=list[AssessmentAssignmentResponse],
)
def list_assigned_reviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(
            "tester",
            *CONTENT_MANAGER_ROLES,
        )
    ),
):
    assignments = get_review_assignments(db)

    # Trainers should only see assessments that
    # they personally assigned to learners.
    #
    # Testers and admins retain broader review visibility.
    if current_user.role == "trainer":
        assignments = [
            assignment
            for assignment in assignments
            if assignment["assigned_by"]
            == current_user.id
        ]

    return assignments


# ============================================================
# GET SINGLE ASSIGNMENT
# ============================================================

@router.get(
    "/assignments/{assignment_id}",
    response_model=AssessmentAssignmentResponse,
)
def get_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assignment = get_assignment_for_user(
        db,
        assignment_id,
        current_user.id,
        current_user.role == "tester",
    )

    if assignment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment assignment not found",
        )

    return assignment


# ============================================================
# REVIEW ASSIGNED ASSESSMENT
# ============================================================

@router.post(
    "/assignments/{assignment_id}/review",
    response_model=AssessmentAssignmentResponse,
)
def review_assigned_assessment(
    assignment_id: int,
    feedback_data: AssessmentAssignmentFeedback,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("tester")
    ),
):
    try:
        result = review_assignment(
            db,
            assignment_id,
            feedback_data,
        )

        log_activity(
            db,
            actor_user_id=current_user.id,
            action="assessment_assignment_reviewed",
            description=(
                f"Tester {current_user.email} "
                f"reviewed assessment assignment "
                f"#{assignment_id}."
            ),
            entity_type="assessment_assignment",
            entity_id=assignment_id,
            details={
                "status": "reviewed",
            },
        )

        return result

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


# ============================================================
# CREATE ASSESSMENT
# ============================================================

@router.post(
    "/",
    response_model=AssessmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_new_assessment(
    assessment_data: AssessmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(*CONTENT_MANAGER_ROLES)
    ),
):
    try:
        assessment = create_assessment(
            db,
            assessment_data,
        )

        # ----------------------------------------------------
        # Record who created the assessment.
        # ----------------------------------------------------

        log_activity(
            db,
            actor_user_id=current_user.id,
            action="assessment_created",
            description=(
                f"{current_user.email} created "
                f"assessment '{assessment.title}'."
            ),
            entity_type="assessment",
            entity_id=assessment.id,
            details={
                "title": assessment.title,
                "question_count": len(
                    assessment_data.questions
                ),
            },
        )

        return assessment

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


# ============================================================
# AUTHORING RESPONSE HELPER
# ============================================================

def _authoring_response(assessment):
    return AssessmentAuthoringResponse(
        id=assessment.id,
        title=assessment.title,
        description=assessment.description,
        is_active=assessment.is_active,
        created_at=assessment.created_at,
        questions=[
            AssessmentAuthoringQuestionResponse(
                id=question.id,
                competency_id=question.competency_id,
                question_text=question.question_text,
                options=question.options,
                correct_answer=question.correct_answer,
                difficulty=question.difficulty,
                explanation=question.explanation,
            )
            for question in assessment.questions
        ],
    )


# ============================================================
# LIST MANAGED ASSESSMENTS
# ============================================================

@router.get(
    "/manage",
    response_model=list[AssessmentAuthoringResponse],
)
def list_manage_assessments(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(*CONTENT_MANAGER_ROLES)
    ),
):
    assessments = (
        db.query(Assessment)
        .order_by(
            Assessment.created_at.desc()
        )
        .all()
    )

    return [
        _authoring_response(assessment)
        for assessment in assessments
    ]


# ============================================================
# GET MANAGED ASSESSMENT
# ============================================================

@router.get(
    "/manage/{assessment_id}",
    response_model=AssessmentAuthoringResponse,
)
def get_manage_assessment_detail(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(*CONTENT_MANAGER_ROLES)
    ),
):
    assessment = get_manage_assessment(
        db,
        assessment_id,
    )

    if assessment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found",
        )

    return _authoring_response(assessment)


# ============================================================
# UPDATE ASSESSMENT
# ============================================================

@router.put(
    "/manage/{assessment_id}",
    response_model=AssessmentAuthoringResponse,
)
def edit_assessment(
    assessment_id: int,
    assessment_data: AssessmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(*CONTENT_MANAGER_ROLES)
    ),
):
    try:
        assessment = update_assessment(
            db,
            assessment_id,
            assessment_data,
        )

        log_activity(
            db,
            actor_user_id=current_user.id,
            action="assessment_updated",
            description=(
                f"{current_user.email} updated "
                f"assessment '{assessment.title}'."
            ),
            entity_type="assessment",
            entity_id=assessment.id,
        )

        return _authoring_response(
            assessment
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


# ============================================================
# DELETE ASSESSMENT
# ============================================================

@router.delete(
    "/manage/{assessment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_assessment(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(*CONTENT_MANAGER_ROLES)
    ),
):
    try:
        delete_assessment(
            db,
            assessment_id,
        )

        log_activity(
            db,
            actor_user_id=current_user.id,
            action="assessment_deleted",
            description=(
                f"{current_user.email} deleted "
                f"assessment #{assessment_id}."
            ),
            entity_type="assessment",
            entity_id=assessment_id,
        )

    except ValueError as exc:
        code = (
            status.HTTP_409_CONFLICT
            if "attempts"
            in str(exc).lower()
            else status.HTTP_404_NOT_FOUND
        )

        raise HTTPException(
            status_code=code,
            detail=str(exc),
        ) from exc

    return None


# ============================================================
# ADD ASSESSMENT QUESTION
# ============================================================

@router.post(
    "/manage/{assessment_id}/questions",
    response_model=AssessmentAuthoringQuestionResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_question(
    assessment_id: int,
    question_data: AssessmentQuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(*CONTENT_MANAGER_ROLES)
    ),
):
    try:
        question = add_assessment_question(
            db,
            assessment_id,
            question_data,
        )

        log_activity(
            db,
            actor_user_id=current_user.id,
            action="assessment_question_created",
            description=(
                f"{current_user.email} added a "
                f"question to assessment "
                f"#{assessment_id}."
            ),
            entity_type="assessment_question",
            entity_id=question.id,
            details={
                "assessment_id": assessment_id,
            },
        )

        return question

    except ValueError as exc:
        code = (
            status.HTTP_400_BAD_REQUEST
            if (
                "answer"
                in str(exc).lower()
                or "options"
                in str(exc).lower()
            )
            else status.HTTP_404_NOT_FOUND
        )

        raise HTTPException(
            status_code=code,
            detail=str(exc),
        ) from exc


# ============================================================
# UPDATE ASSESSMENT QUESTION
# ============================================================

@router.put(
    "/manage/questions/{question_id}",
    response_model=AssessmentAuthoringQuestionResponse,
)
def edit_question(
    question_id: int,
    question_data: AssessmentQuestionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(*CONTENT_MANAGER_ROLES)
    ),
):
    try:
        question = update_assessment_question(
            db,
            question_id,
            question_data,
        )

        log_activity(
            db,
            actor_user_id=current_user.id,
            action="assessment_question_updated",
            description=(
                f"{current_user.email} updated "
                f"assessment question "
                f"#{question_id}."
            ),
            entity_type="assessment_question",
            entity_id=question_id,
        )

        return question

    except ValueError as exc:
        code = (
            status.HTTP_400_BAD_REQUEST
            if (
                "answer"
                in str(exc).lower()
                or "options"
                in str(exc).lower()
            )
            else status.HTTP_404_NOT_FOUND
        )

        raise HTTPException(
            status_code=code,
            detail=str(exc),
        ) from exc


# ============================================================
# DELETE ASSESSMENT QUESTION
# ============================================================

@router.delete(
    "/manage/questions/{question_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(*CONTENT_MANAGER_ROLES)
    ),
):
    try:
        delete_assessment_question(
            db,
            question_id,
        )

        log_activity(
            db,
            actor_user_id=current_user.id,
            action="assessment_question_deleted",
            description=(
                f"{current_user.email} deleted "
                f"assessment question "
                f"#{question_id}."
            ),
            entity_type="assessment_question",
            entity_id=question_id,
        )

    except ValueError as exc:
        code = (
            status.HTTP_409_CONFLICT
            if "answers"
            in str(exc).lower()
            else status.HTTP_404_NOT_FOUND
        )

        raise HTTPException(
            status_code=code,
            detail=str(exc),
        ) from exc

    return None


# ============================================================
# MY ATTEMPT HISTORY
# ============================================================

@router.get(
    "/my-attempts",
    response_model=list[AssessmentAttemptResponse],
)
def list_my_attempts(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    return get_user_attempts(
        db,
        current_user.id,
    )


# ============================================================
# GET SINGLE ATTEMPT / RESULT
# ============================================================

@router.get(
    "/attempts/{attempt_id}",
    response_model=AssessmentAttemptDetailResponse,
)
def get_my_attempt(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    attempt = get_attempt_by_id(
        db,
        attempt_id,
        current_user.id,
    )

    if attempt is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment attempt not found",
        )

    answers = get_attempt_answers(
        db,
        attempt.id,
    )

    return AssessmentAttemptDetailResponse(
        attempt=AssessmentAttemptResponse(
            id=attempt.id,
            user_id=attempt.user_id,
            assessment_id=attempt.assessment_id,
            score=attempt.score,
            total_questions=attempt.total_questions,
            percentage=attempt.percentage,
            completed_at=attempt.completed_at,
        ),
        answers=[
            AssessmentAnswerResponse(
                id=answer.id,
                attempt_id=answer.attempt_id,
                question_id=answer.question_id,
                selected_answer=answer.selected_answer,
                is_correct=answer.is_correct,
            )
            for answer in answers
        ],
    )


# ============================================================
# GET SINGLE ASSESSMENT
# ============================================================

@router.get(
    "/{assessment_id}",
    response_model=AssessmentResponse,
)
def get_single_assessment(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
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


# ============================================================
# SUBMIT ASSESSMENT
# ============================================================

@router.post(
    "/{assessment_id}/submit",
    response_model=AssessmentResultResponse,
)
def submit_user_assessment(
    assessment_id: int,
    submission: AssessmentSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    try:
        attempt = submit_assessment(
            db,
            current_user.id,
            assessment_id,
            submission,
        )

        # ----------------------------------------------------
        # Record individual assessment attempt.
        # ----------------------------------------------------

        log_activity(
            db,
            actor_user_id=current_user.id,
            target_user_id=current_user.id,
            action="assessment_completed",
            description=(
                f"Learner {current_user.email} "
                f"completed assessment "
                f"#{assessment_id} with "
                f"{attempt.percentage}%."
            ),
            entity_type="assessment_attempt",
            entity_id=attempt.id,
            details={
                "assessment_id": assessment_id,
                "attempt_id": attempt.id,
                "score": attempt.score,
                "total_questions": (
                    attempt.total_questions
                ),
                "percentage": attempt.percentage,
            },
        )

        return AssessmentResultResponse(
            attempt_id=attempt.id,
            assessment_id=attempt.assessment_id,
            score=attempt.score,
            total_questions=attempt.total_questions,
            percentage=attempt.percentage,
        )

    except ValueError as exc:

        message = str(exc)

        if message == "Assessment not found":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=message,
            ) from exc

        if message == "Assessment has no questions":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=message,
            ) from exc

        if (
            message.startswith(
                "Invalid question ID"
            )
            or message.startswith(
                "Invalid answer option"
            )
            or message
            == "Duplicate question IDs are not allowed"
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=message,
            ) from exc

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message,
        ) from exc