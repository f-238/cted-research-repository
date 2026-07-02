from functools import lru_cache
from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "CTE Research Repository and Format Compliance System"
    database_url: str = "sqlite:///./cte_repository.db"
    secret_key: str = Field("dev-secret-change-me", validation_alias=AliasChoices("JWT_SECRET", "SECRET_KEY"))
    access_token_expire_minutes: int = 480
    backend_cors_origins: str = Field(
        "",
        validation_alias=AliasChoices("CORS_ALLOWED_ORIGINS", "BACKEND_CORS_ORIGINS"),
    )
    max_upload_size_mb: int = 20
    admin_email: str = "admin@cte.edu"
    admin_password: str = "admin123"
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    supabase_bucket: str = "research-files"

    class Config:
        env_file = ".env"

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.backend_cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
