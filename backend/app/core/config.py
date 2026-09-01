"""Centralised settings, loaded from environment / .env. No secrets live in code."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "AI-Guided Project Progress Tracking Platform API"
    api_prefix: str = "/api"

    database_url: str = "postgresql://aapm:aapm@localhost:5432/aapm"

    secret_key: str = "insecure-dev-key-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24

    cors_origins: str = "http://localhost:3000,http://localhost:5173"

    llm_provider: str = "auto"  # auto | openai | huggingface | offline
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    huggingface_api_key: str = ""
    hf_model: str = "mistralai/Mistral-7B-Instruct-v0.3"
    llm_temperature: float = 0.4
    llm_max_tokens: int = 2200

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def resolved_llm_provider(self) -> str:
        if self.llm_provider != "auto":
            return self.llm_provider
        if self.openai_api_key:
            return "openai"
        if self.huggingface_api_key:
            return "huggingface"
        return "offline"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
