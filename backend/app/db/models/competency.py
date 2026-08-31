from sqlalchemy import CheckConstraint, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Competency(Base):
    __tablename__ = "competencies"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
    )

    category: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    description: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    user_competencies = relationship(
        "UserCompetency",
        back_populates="competency",
        cascade="all, delete-orphan",
    )


class UserCompetency(Base):
    __tablename__ = "user_competencies"

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

    competency_id: Mapped[int] = mapped_column(
        ForeignKey("competencies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    current_level: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
    )

    required_level: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
    )

    competency = relationship(
        "Competency",
        back_populates="user_competencies",
    )

    __table_args__ = (
        CheckConstraint(
            "current_level >= 1 AND current_level <= 5",
            name="check_current_level",
        ),
        CheckConstraint(
            "required_level >= 1 AND required_level <= 5",
            name="check_required_level",
        ),
    )