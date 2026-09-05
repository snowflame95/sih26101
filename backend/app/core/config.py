from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str

    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Special registration key.
    #
    # This is NOT used by public learner registration.
    # It is only used by the privileged /users endpoint
    # for creating trainer/admin accounts.
    SPECIAL_REGISTRATION_KEY: str

    # ============================================================
    # AI CONFIGURATION
    # ============================================================

    # Keep false while testing the deterministic fallback.
    AI_ENABLED: bool = False

    # Current AI provider.
    AI_PROVIDER: str = "gemini"

    # Gemini API key.
    # NEVER expose this to the React frontend.
    GEMINI_API_KEY: str | None = None

    # Can be changed from .env without changing application code.
    GEMINI_MODEL: str = "gemini-3.7-flash"

    # ============================================================
    # iGOT CONFIGURATION
    # ============================================================

    # This controls whether curated iGOT resources are available
    # in the recommendation layer.
    IGOT_ENABLED: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
    )


settings = Settings()