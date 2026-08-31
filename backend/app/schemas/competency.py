from pydantic import BaseModel, Field


class CompetencyCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    category: str = Field(..., min_length=2, max_length=50)
    description: str | None = Field(default=None, max_length=500)


class CompetencyResponse(BaseModel):
    id: int
    name: str
    category: str
    description: str | None

    model_config = {
        "from_attributes": True
    }


class UserCompetencyCreate(BaseModel):
    competency_id: int = Field(..., gt=0)
    current_level: int = Field(default=1, ge=1, le=5)
    required_level: int = Field(default=1, ge=1, le=5)


class UserCompetencyUpdate(BaseModel):
    current_level: int | None = Field(default=None, ge=1, le=5)
    required_level: int | None = Field(default=None, ge=1, le=5)


class UserCompetencyResponse(BaseModel):
    id: int
    user_id: int
    competency_id: int
    current_level: int
    required_level: int

    competency: CompetencyResponse

    model_config = {
        "from_attributes": True
    }