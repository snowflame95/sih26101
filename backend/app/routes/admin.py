from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import require_role
from app.db.database import get_db
from app.db.models.assessment import (
    Assessment,
    AssessmentAttempt,
    AssessmentAssignment,
)
from app.db.models.profile import Profile
from app.db.models.user import User


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

    average_score = db.scalar(
        select(func.avg(AssessmentAttempt.percentage))
    )

    total_assignments = db.scalar(
        select(func.count(AssessmentAssignment.id))
    ) or 0

    completed_assignments = db.scalar(
        select(func.count(AssessmentAssignment.id)).where(
            AssessmentAssignment.status == "completed"
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
            "average_score": round(
                float(average_score),
                2,
            ) if average_score is not None else 0.0,
        },
        "assignments": {
            "total": total_assignments,
            "completed": completed_assignments,
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
        attempt_count = db.scalar(
            select(func.count(AssessmentAttempt.id)).where(
                AssessmentAttempt.assessment_id
                == assessment.id
            )
        ) or 0

        average_score = db.scalar(
            select(func.avg(AssessmentAttempt.percentage)).where(
                AssessmentAttempt.assessment_id
                == assessment.id
            )
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
                "attempt_count": attempt_count,
                "average_score": (
                    round(float(average_score), 2)
                    if average_score is not None
                    else 0.0
                ),
            }
        )

    return result