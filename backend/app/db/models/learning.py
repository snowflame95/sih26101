from datetime import datetime, timezone

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class LearningModule(Base):
    __tablename__ = "learning_modules"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    competency_id: Mapped[int] = mapped_column(
        ForeignKey("competencies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    difficulty: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="beginner",
    )

    estimated_hours: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
    )

    module_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    competency = relationship(
        "Competency",
    )

    progress = relationship(
        "LearningProgress",
        back_populates="learning_module",
        cascade="all, delete-orphan",
    )

    resources = relationship(
        "LearningResource",
        back_populates="learning_module",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        CheckConstraint(
            "estimated_hours >= 1",
            name="check_estimated_hours",
        ),
        CheckConstraint(
            "module_order >= 1",
            name="check_module_order",
        ),
    )


class LearningProgress(Base):
    __tablename__ = "learning_progress"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    learning_module_id: Mapped[int] = mapped_column(
        ForeignKey("learning_modules.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="not_started",
    )

    progress_percentage: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    learning_module = relationship(
        "LearningModule",
        back_populates="progress",
    )

    __table_args__ = (
        CheckConstraint(
            "progress_percentage >= 0 AND progress_percentage <= 100",
            name="check_progress_percentage",
        ),
        CheckConstraint(
            "status IN ('not_started', 'in_progress', 'completed')",
            name="check_learning_progress_status",
        ),
        UniqueConstraint(
            "user_id",
            "learning_module_id",
            name="uq_learning_progress_user_module",
        ),
    )


class LearningResource(Base):
    __tablename__ = "learning_resources"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    learning_module_id: Mapped[int] = mapped_column(
        ForeignKey("learning_modules.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    resource_type: Mapped[str] = mapped_column(String(30), nullable=False)
    resource_url: Mapped[str] = mapped_column(String(2048), nullable=False)
    resource_order: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    learning_module = relationship(
        "LearningModule",
        back_populates="resources",
    )

    __table_args__ = (
        CheckConstraint("resource_order >= 1", name="check_resource_order"),
        CheckConstraint(
            "resource_type IN ('article', 'video', 'document', 'external_link')",
            name="check_resource_type",
        ),
    )