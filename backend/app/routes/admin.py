from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import require_role
from app.db.database import get_db
from app.db.models.activity import ActivityLog
from app.db.models.assessment import (
    Assessment,
    AssessmentAssignment,
    AssessmentAttempt,
)
from app.db.models.learning import (
    LearningModule,
    LearningProgress,
    LearningResource,
)
from app.db.models.profile import Profile
from app.db.models.user import User
from app.services.activity_service import get_activity_logs


router = APIRouter(
    prefix="/api/admin",
    tags=["Administration"],
)


# ============================================================
# ADMIN OVERVIEW
# ============================================================

@router.get("/overview")
def get_admin_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    total_users = db.scalar(
        select(func.count(User.id))
    ) or 0

    learner_count = db.scalar(
        select(func.count(User.id)).where(
            User.role == "learner"
        )
    ) or 0

    trainer_count = db.scalar(
        select(func.count(User.id)).where(
            User.role == "trainer"
        )
    ) or 0

    admin_count = db.scalar(
        select(func.count(User.id)).where(
            User.role == "admin"
        )
    ) or 0

    tester_count = db.scalar(
        select(func.count(User.id)).where(
            User.role == "tester"
        )
    ) or 0

    active_users = db.scalar(
        select(func.count(User.id)).where(
            User.is_active.is_(True)
        )
    ) or 0

    inactive_users = db.scalar(
        select(func.count(User.id)).where(
            User.is_active.is_(False)
        )
    ) or 0

    total_assessments = db.scalar(
        select(func.count(Assessment.id))
    ) or 0

    active_assessments = db.scalar(
        select(func.count(Assessment.id)).where(
            Assessment.is_active.is_(True)
        )
    ) or 0

    total_attempts = db.scalar(
        select(func.count(AssessmentAttempt.id))
    ) or 0

    total_assignments = db.scalar(
        select(func.count(AssessmentAssignment.id))
    ) or 0

    completed_assignments = db.scalar(
        select(func.count(AssessmentAssignment.id)).where(
            AssessmentAssignment.status == "completed"
        )
    ) or 0

    learning_modules = db.scalar(
        select(func.count(LearningModule.id))
    ) or 0

    learning_resources = db.scalar(
        select(func.count(LearningResource.id))
    ) or 0

    learning_completions = db.scalar(
        select(func.count(LearningProgress.id)).where(
            LearningProgress.status == "completed"
        )
    ) or 0

    profiles_completed = db.scalar(
        select(func.count(Profile.id))
    ) or 0

    return {
        "users": {
            "total": total_users,
            "learners": learner_count,
            "trainers": trainer_count,
            "admins": admin_count,
            "testers": tester_count,
            "active": active_users,
            "inactive": inactive_users,
        },
        "assessments": {
            "total": total_assessments,
            "active": active_assessments,
            "attempts": total_attempts,
        },
        "assignments": {
            "total": total_assignments,
            "completed": completed_assignments,
        },
        "learning": {
            "modules": learning_modules,
            "resources": learning_resources,
            "completed": learning_completions,
        },
        "profiles": {
            "completed": profiles_completed,
        },
    }


# ============================================================
# ALL USERS
# ============================================================

@router.get("/users")
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    users = db.scalars(
        select(User).order_by(User.id.desc())
    ).all()

    return [
        {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
            "profile": (
                {
                    "full_name": user.profile.full_name,
                    "designation": user.profile.designation,
                    "department": user.profile.department,
                    "experience_years": user.profile.experience_years,
                }
                if user.profile
                else None
            ),
        }
        for user in users
    ]


# ============================================================
# RECENT USERS
# ============================================================

@router.get("/users/recent")
def get_recent_users(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    limit = max(1, min(limit, 50))

    users = db.scalars(
        select(User)
        .order_by(User.id.desc())
        .limit(limit)
    ).all()

    return [
        {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
        }
        for user in users
    ]


# ============================================================
# ADMIN USER STATUS
# ============================================================

@router.patch("/users/{user_id}/status")
def update_user_status(
    user_id: int,
    is_active: bool,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Administrators cannot deactivate their own account",
        )

    user = db.get(User, user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    user.is_active = is_active

    db.commit()
    db.refresh(user)

    action = (
        "user_activated"
        if is_active
        else "user_deactivated"
    )

    description = (
        f"Administrator changed user #{user.id} "
        f"({user.email}) to "
        f"{'active' if is_active else 'inactive'}."
    )

    try:
        from app.services.activity_service import log_activity

        log_activity(
            db,
            actor_user_id=current_user.id,
            target_user_id=user.id,
            action=action,
            description=description,
            entity_type="user",
            entity_id=user.id,
            details={
                "is_active": is_active,
            },
        )
    except Exception:
        pass

    return {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
    }


# ============================================================
# ASSESSMENT ATTEMPTS
# ============================================================

@router.get("/assessment-attempts")
def get_assessment_attempts(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    attempts = db.scalars(
        select(AssessmentAttempt)
        .order_by(
            AssessmentAttempt.completed_at.desc()
        )
    ).all()

    result = []

    for attempt in attempts:
        learner = db.get(
            User,
            attempt.user_id,
        )

        assessment = db.get(
            Assessment,
            attempt.assessment_id,
        )

        previous_attempt_count = db.scalar(
            select(func.count(AssessmentAttempt.id)).where(
                AssessmentAttempt.user_id == attempt.user_id,
                AssessmentAttempt.assessment_id
                == attempt.assessment_id,
                AssessmentAttempt.id < attempt.id,
            )
        ) or 0

        result.append(
            {
                "attempt_id": attempt.id,
                "attempt_number": previous_attempt_count + 1,
                "learner_id": attempt.user_id,
                "learner_email": (
                    learner.email
                    if learner
                    else "Unknown"
                ),
                "assessment_id": attempt.assessment_id,
                "assessment_title": (
                    assessment.title
                    if assessment
                    else "Unknown"
                ),
                "score": attempt.score,
                "total_questions": attempt.total_questions,
                "percentage": attempt.percentage,
                "completed_at": attempt.completed_at,
            }
        )

    return result


# ============================================================
# ASSESSMENT SUMMARY
# ============================================================

@router.get("/assessments")
def get_assessment_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    assessments = db.scalars(
        select(Assessment)
        .order_by(Assessment.id.desc())
    ).all()

    result = []

    for assessment in assessments:
        attempts = list(
            db.scalars(
                select(AssessmentAttempt)
                .where(
                    AssessmentAttempt.assessment_id
                    == assessment.id
                )
                .order_by(
                    AssessmentAttempt.completed_at.desc()
                )
            ).all()
        )

        latest_attempt = (
            attempts[0]
            if attempts
            else None
        )

        best_attempt = (
            max(
                attempts,
                key=lambda item: item.percentage,
            )
            if attempts
            else None
        )

        result.append(
            {
                "id": assessment.id,
                "title": assessment.title,
                "description": assessment.description,
                "is_active": assessment.is_active,
                "created_at": assessment.created_at,
                "question_count": len(
                    assessment.questions
                ),
                "attempt_count": len(attempts),
                "latest_score": (
                    latest_attempt.percentage
                    if latest_attempt
                    else None
                ),
                "best_score": (
                    best_attempt.percentage
                    if best_attempt
                    else None
                ),
                "latest_attempt_at": (
                    latest_attempt.completed_at
                    if latest_attempt
                    else None
                ),
            }
        )

    return result


# ============================================================
# ASSIGNMENT ACTIVITY
# ============================================================

@router.get("/assignments")
def get_admin_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    assignments = db.scalars(
        select(AssessmentAssignment)
        .order_by(
            AssessmentAssignment.assigned_at.desc()
        )
    ).all()

    result = []

    for assignment in assignments:
        assessment = db.get(
            Assessment,
            assignment.assessment_id,
        )

        learner = db.get(
            User,
            assignment.learner_id,
        )

        trainer = db.get(
            User,
            assignment.assigned_by,
        )

        result.append(
            {
                "id": assignment.id,
                "assessment_id": assignment.assessment_id,
                "assessment_title": (
                    assessment.title
                    if assessment
                    else "Unknown"
                ),
                "learner_id": assignment.learner_id,
                "learner_email": (
                    learner.email
                    if learner
                    else "Unknown"
                ),
                "assigned_by": assignment.assigned_by,
                "trainer_email": (
                    trainer.email
                    if trainer
                    else "Unknown"
                ),
                "status": assignment.status,
                "assigned_at": assignment.assigned_at,
                "due_at": assignment.due_at,
                "completed_at": assignment.completed_at,
                "feedback": assignment.feedback,
            }
        )

    return result


# ============================================================
# LEARNING ACTIVITY
# ============================================================

@router.get("/learning")
def get_admin_learning_activity(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    progress_items = db.scalars(
        select(LearningProgress)
        .order_by(
            LearningProgress.started_at.desc()
        )
    ).all()

    result = []

    for progress in progress_items:
        learner = db.get(
            User,
            progress.user_id,
        )

        module = db.get(
            LearningModule,
            progress.learning_module_id,
        )

        result.append(
            {
                "id": progress.id,
                "learner_id": progress.user_id,
                "learner_email": (
                    learner.email
                    if learner
                    else "Unknown"
                ),
                "module_id": progress.learning_module_id,
                "module_title": (
                    module.title
                    if module
                    else "Unknown"
                ),
                "status": progress.status,
                "progress_percentage": (
                    progress.progress_percentage
                ),
                "started_at": progress.started_at,
                "completed_at": progress.completed_at,
            }
        )

    return result


# ============================================================
# ACTIVITY TIMELINE
# ============================================================

@router.get("/activity")
def get_admin_activity(
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    logs = get_activity_logs(
        db,
        limit,
    )

    result = []

    for log in logs:
        actor = (
            db.get(
                User,
                log.actor_user_id,
            )
            if log.actor_user_id
            else None
        )

        target = (
            db.get(
                User,
                log.target_user_id,
            )
            if log.target_user_id
            else None
        )

        result.append(
            {
                "id": log.id,
                "action": log.action,
                "description": log.description,
                "entity_type": log.entity_type,
                "entity_id": log.entity_id,
                "actor_user_id": log.actor_user_id,
                "actor_email": (
                    actor.email
                    if actor
                    else None
                ),
                "target_user_id": log.target_user_id,
                "target_email": (
                    target.email
                    if target
                    else None
                ),
                "details": log.details,
                "created_at": log.created_at,
            }
        )

    return result