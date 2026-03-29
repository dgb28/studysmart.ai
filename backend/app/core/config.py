"""Application configuration via pydantic-settings."""
import json
from typing import List
from urllib.parse import quote_plus

from pydantic import Field, computed_field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=True)
    # App
    APP_NAME: str = "Hackathon API"
    APP_ENV: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    SECRET_KEY: str = "change-me-32-chars-min"

    # Raw string so .env can use comma-separated URLs (pydantic-settings JSON-decodes list fields otherwise).
    cors_origins_raw: str = Field(default="http://localhost:3000", validation_alias="CORS_ORIGINS")

    @computed_field
    @property
    def CORS_ORIGINS(self) -> List[str]:
        s = self.cors_origins_raw.strip()
        if s.startswith("["):
            try:
                parsed = json.loads(s)
                if isinstance(parsed, list):
                    return [str(x).strip() for x in parsed if str(x).strip()]
            except json.JSONDecodeError:
                pass
        return [p.strip() for p in s.split(",") if p.strip()]

    # Database — leave DATABASE_URL empty to build from POSTGRES_* (password is URL-encoded; @ is safe).
    DATABASE_URL: str = ""
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str = "hackathon"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    @model_validator(mode="after")
    def assemble_database_url(self):
        if (self.DATABASE_URL or "").strip():
            return self
        self.DATABASE_URL = (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{quote_plus(self.POSTGRES_PASSWORD)}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )
        return self

    # Auth
    JWT_SECRET: str = "change-me-jwt-secret"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # LLM
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"
    ANTHROPIC_API_KEY: str = ""
    GOOGLE_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-pro"

    # Storage
    STORAGE_BACKEND: str = "local"
    AWS_S3_BUCKET: str = ""
    GCS_BUCKET: str = ""

    # AWS
    AWS_REGION: str = "us-east-1"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""

    # GCP
    GCP_PROJECT_ID: str = ""
    GCP_REGION: str = "us-central1"

settings = Settings()
