"""Application configuration using Pydantic Settings."""

from __future__ import annotations

import os
from pathlib import Path
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


def _read_gemini_key() -> str:
    """Read Gemini API key from file or environment variable."""
    env_val = os.getenv("GEMINI_API_KEY", "")
    if env_val:
        return env_val
    key_path = Path.home() / ".config" / "gemini_api_key"
    if key_path.exists():
        return key_path.read_text().strip()
    return ""


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Application
    APP_NAME: str = "Hakka Corpus API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:54322/postgres"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # External APIs
    GEMINI_API_KEY: str = _read_gemini_key()

    # Security
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ALGORITHM: str = "HS256"

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]


@lru_cache
def get_settings() -> Settings:
    return Settings()
