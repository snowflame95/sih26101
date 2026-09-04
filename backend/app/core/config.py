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

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
    )


settings = Settings()