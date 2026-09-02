from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AssessmentQuestionCreate(BaseModel):
    competency_id: int = Field(..., gt=0)
    question_text: str = Field(
        ...,
        min_length=3,
        max_length=1000,
    )
    options: list[str] = Field(
        ...,
        min_length=2,
    )
    correct_answer: str = Field(
        ...,
        min_length=1,
        max_length=255,
    )
    difficulty: str = Field(
        default="medium",
        min_length=3,
        max_length=20,
    )
    explanation: str | None = Field(
        default=None,
        max_length=2000,
    )


class AssessmentCreate(BaseModel):
    title: str = Field(
        ...,
        min_length=2,
        max_length=255,
    )
    description: str | None = Field(
        default=None,
        max_length=2000,
    )
    questions: list[
        AssessmentQuestionCreate
    ] = Field(min_length=1)


class AssessmentUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    is_active: bool | None = None


class AssessmentQuestionUpdate(BaseModel):
    competency_id: int | None = Field(default=None, gt=0)
    question_text: str | None = Field(default=None, min_length=3, max_length=1000)
    options: list[str] | None = Field(default=None, min_length=2)
    correct_answer: str | None = Field(default=None, min_length=1, max_length=255)
    difficulty: str | None = Field(default=None, min_length=3, max_length=20)
    explanation: str | None = Field(default=None, max_length=2000)


class AssessmentQuestionResponse(BaseModel):
    id: int
    competency_id: int
    question_text: str
    options: list[str]
    difficulty: str
    explanation: str | None = None

    model_config = ConfigDict(
        from_attributes=True
    )


class AssessmentResponse(BaseModel):
    id: int
    title: str
    description: str | None
    is_active: bool
    created_at: datetime
    questions: list[
        AssessmentQuestionResponse
    ]

    model_config = ConfigDict(
        from_attributes=True
    )


class AssessmentAuthoringQuestionResponse(AssessmentQuestionResponse):
    correct_answer: str


class AssessmentAuthoringResponse(BaseModel):
    id: int
    title: str
    description: str | None
    is_active: bool
    created_at: datetime
    questions: list[AssessmentAuthoringQuestionResponse]

    model_config = ConfigDict(from_attributes=True)


class AssessmentListResponse(BaseModel):
    id: int
    title: str
    description: str | None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


class AnswerSubmission(BaseModel):
    question_id: int = Field(..., gt=0)
    selected_answer: str = Field(
        ...,
        min_length=1,
        max_length=255,
    )


class AssessmentSubmitRequest(BaseModel):
    answers: list[AnswerSubmission] = Field(
        min_length=1
    )


class AssessmentResultResponse(BaseModel):
    attempt_id: int
    assessment_id: int
    score: int
    total_questions: int
    percentage: float


class AssessmentAttemptResponse(BaseModel):
    id: int
    user_id: int
    assessment_id: int
    score: int
    total_questions: int
    percentage: float
    completed_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


class AssessmentAnswerResponse(BaseModel):
    id: int
    attempt_id: int
    question_id: int
    selected_answer: str
    is_correct: bool

    model_config = ConfigDict(
        from_attributes=True
    )


class AssessmentAttemptDetailResponse(BaseModel):
    attempt: AssessmentAttemptResponse
    answers: list[AssessmentAnswerResponse]


class AssessmentAssignmentCreate(BaseModel):
    assessment_id: int = Field(..., gt=0)
    learner_id: int = Field(..., gt=0)
    due_at: datetime | None = None


class AssessmentAssignmentFeedback(BaseModel):
    feedback: str = Field(..., min_length=1, max_length=4000)


class AssessmentAssignmentResponse(BaseModel):
    id: int
    assessment_id: int
    learner_id: int
    assigned_by: int
    status: str
    assigned_at: datetime
    due_at: datetime | None
    completed_at: datetime | None
    feedback: str | None
    reviewed_at: datetime | None
    assessment: AssessmentListResponse
    learner_email: str
    attempt: AssessmentAttemptResponse | None = None
    answers: list[AssessmentAnswerResponse] = []

    model_config = ConfigDict(from_attributes=True)