from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.activity import ActivityLog


def log_activity(
    db: Session,
    *,
    actor_user_id: int | None,
    action: str,
    description: str,
    target_user_id: int | None = None,
    entity_type: str | None = None,
    entity_id: int | None = None,
    details: dict | None = None,
) -> ActivityLog:
    activity = ActivityLog(
        actor_user_id=actor_user_id,
        target_user_id=target_user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        description=description,
        details=details,
    )

    db.add(activity)
    db.commit()
    db.refresh(activity)

    return activity


def get_activity_logs(
    db: Session,
    limit: int = 100,
) -> list[ActivityLog]:
    limit = max(1, min(limit, 500))

    return list(
        db.scalars(
            select(ActivityLog)
            .order_by(ActivityLog.created_at.desc())
            .limit(limit)
        ).all()
    )