from pydantic import BaseModel, Field


class SkillAnalysisRequest(BaseModel):
    """
    Analyse one competency when competency_id is supplied.

    If competency_id is omitted, analyse all competencies
    assigned to the current learner.
    """

    competency_id: int | None = Field(
        default=None,
        gt=0,
    )


class AssessmentPerformance(BaseModel):
    attempts: int = Field(
        ge=0,
    )

    latest_percentage: float | None = None

    best_percentage: float | None = None

    competency_accuracy: float | None = None


class SkillAnalysisItem(BaseModel):
    competency_id: int

    competency_name: str

    category: str | None = None

    current_level: int = Field(
        ge=1,
        le=5,
    )

    required_level: int = Field(
        ge=1,
        le=5,
    )

    gap: int = Field(
        ge=0,
        le=4,
    )

    status: str

    priority: str

    analysis: str

    strengths: list[str] = Field(
        default_factory=list,
    )

    weaknesses: list[str] = Field(
        default_factory=list,
    )

    recommended_focus: list[str] = Field(
        default_factory=list,
    )

    assessment_performance: AssessmentPerformance

    ai_generated: bool


class SkillAnalysisResponse(BaseModel):
    generated_for_user_id: int

    ai_available: bool

    items: list[SkillAnalysisItem]


class LearningRecommendation(BaseModel):
    title: str

    source: str

    resource_type: str

    url: str

    competency_id: int | None = None

    competency_name: str | None = None

    reason: str


class LearningRecommendationResponse(BaseModel):
    recommendations: list[LearningRecommendation]

    source_note: str