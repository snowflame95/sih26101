from app.db.database import Base, engine

from app.db.models.user import User
from app.db.models.profile import Profile
from app.db.models.competency import Competency, UserCompetency

from app.db.models.assessment import (
    Assessment,
    AssessmentQuestion,
    AssessmentAttempt,
    AssessmentAnswer,
    AssessmentAssignment,
)

from app.db.models.learning import (
    LearningModule,
    LearningProgress,
    LearningResource,
)

from app.db.models.activity import ActivityLog


def init_db():
    Base.metadata.create_all(bind=engine)