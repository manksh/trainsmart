from typing import Optional, List
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://trainsmart:trainsmart_dev@localhost:5432/trainsmart"

    # Security
    secret_key: str = "dev-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    # Environment
    environment: str = "development"
    debug: bool = True

    # CORS
    cors_origins: str = "http://localhost:3000"

    # Email (Resend)
    resend_api_key: Optional[str] = None
    from_email: str = "noreply@trainsmart.app"

    # App
    app_name: str = "TrainSmart"
    api_v1_prefix: str = "/api/v1"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
