from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AssessmentQuestionCreate(BaseModel):
    competency_id: int
    question_text: str
    options: list[str] = Field(min_length=2)
    correct_answer: str
    difficulty: str = "medium"
    explanation: str | None = None


class AssessmentCreate(BaseModel):
    title: str
    description: str | None = None
    questions: list[AssessmentQuestionCreate] = Field(min_length=1)


class AssessmentQuestionResponse(BaseModel):
    id: int
    competency_id: int
    question_text: str
    options: list[str]
    difficulty: str
    explanation: str | None = None

    model_config = ConfigDict(from_attributes=True)


class AssessmentResponse(BaseModel):
    id: int
    title: str
    description: str | None
    is_active: bool
    created_at: datetime
    questions: list[AssessmentQuestionResponse]

    model_config = ConfigDict(from_attributes=True)


class AnswerSubmission(BaseModel):
    question_id: int
    selected_answer: str


class AssessmentSubmitRequest(BaseModel):
    answers: list[AnswerSubmission] = Field(min_length=1)


class AssessmentResultResponse(BaseModel):
    attempt_id: int
    assessment_id: int
    score: int
    total_questions: int
    percentage: float