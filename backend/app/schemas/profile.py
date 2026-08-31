from pydantic import BaseModel, Field


class ProfileCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    designation: str = Field(..., min_length=2, max_length=150)
    department: str = Field(..., min_length=2, max_length=150)
    experience_years: int = Field(default=0, ge=0)
    education: str | None = Field(default=None, max_length=255)
    previous_training: str | None = None


class ProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=150)
    designation: str | None = Field(default=None, min_length=2, max_length=150)
    department: str | None = Field(default=None, min_length=2, max_length=150)
    experience_years: int | None = Field(default=None, ge=0)
    education: str | None = Field(default=None, max_length=255)
    previous_training: str | None = None


class ProfileResponse(BaseModel):
    id: int
    user_id: int
    full_name: str
    designation: str
    department: str
    experience_years: int
    education: str | None
    previous_training: str | None

    model_config = {
        "from_attributes": True
    }