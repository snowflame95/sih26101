from datetime import datetime
from typing import Literal

from pydantic import AnyHttpUrl, BaseModel, ConfigDict, Field


LearningProgressStatus = Literal[
    "not_started",
    "in_progress",
    "completed",
]


class LearningModuleCreate(BaseModel):
    competency_id: int
    title: str = Field(..., min_length=2, max_length=255)
    description: str | None = None
    difficulty: str = Field(
        default="beginner",
        min_length=2,
        max_length=20,
    )
    estimated_hours: int = Field(
        default=1,
        ge=1,
    )
    module_order: int = Field(
        default=1,
        ge=1,
    )


class LearningModuleUpdate(BaseModel):
    competency_id: int | None = Field(default=None, gt=0)
    title: str | None = Field(default=None, min_length=2, max_length=255)
    description: str | None = None
    difficulty: str | None = Field(default=None, min_length=2, max_length=20)
    estimated_hours: int | None = Field(default=None, ge=1)
    module_order: int | None = Field(default=None, ge=1)


class LearningResourceCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: str | None = None
    resource_type: Literal["article", "video", "document", "external_link"]
    resource_url: AnyHttpUrl
    resource_order: int = Field(default=1, ge=1)


class LearningResourceUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=255)
    description: str | None = None
    resource_type: Literal["article", "video", "document", "external_link"] | None = None
    resource_url: AnyHttpUrl | None = None
    resource_order: int | None = Field(default=None, ge=1)


class LearningModuleResponse(BaseModel):
    id: int
    competency_id: int
    title: str
    description: str | None
    difficulty: str
    estimated_hours: int
    module_order: int
    created_at: datetime
    resources: list["LearningResourceResponse"] = []

    model_config = ConfigDict(from_attributes=True)


class LearningProgressUpdate(BaseModel):
    status: LearningProgressStatus = "not_started"

    progress_percentage: int = Field(
        default=0,
        ge=0,
        le=100,
    )


class LearningProgressResponse(BaseModel):
    id: int
    user_id: int
    learning_module_id: int
    status: LearningProgressStatus
    progress_percentage: int
    started_at: datetime | None
    completed_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class LearningResourceResponse(BaseModel):
    id: int
    learning_module_id: int
    title: str
    description: str | None
    resource_type: str
    resource_url: str
    resource_order: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)