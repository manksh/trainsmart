from typing import Optional, List
from pydantic_settings import BaseSettings
from pydantic import field_validator
from functools import lru_cache


# Weak/default keys that should never be used in production
WEAK_SECRET_KEYS = {
    "dev-secret-key-change-in-production",
    "secret",
    "password",
    "changeme",
    "change-me",
    "development",
    "test",
}


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://trainsmart:trainsmart_dev@localhost:5432/trainsmart"

    # Environment (must be defined before secret_key for validator to work)
    environment: str = "development"
    debug: bool = True

    # Security
    secret_key: str = "dev-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    @field_validator("secret_key")
    @classmethod
    def validate_secret_key(cls, v: str, info) -> str:
        """
        Validate SECRET_KEY security requirements in production.

        In production environment:
        - Rejects weak/default keys
        - Requires at least 32 characters
        """
        # Get environment from the data being validated
        # Note: We need to access via info.data for cross-field validation
        environment = info.data.get("environment", "development")

        if environment == "production":
            # Check for weak/default keys
            if v.lower() in WEAK_SECRET_KEYS or v == "dev-secret-key-change-in-production":
                raise ValueError(
                    "SECURITY ERROR: SECRET_KEY is set to a weak/default value. "
                    "In production, you must use a strong, unique secret key. "
                    "Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(32))\""
                )

            # Check minimum length
            if len(v) < 32:
                raise ValueError(
                    f"SECURITY ERROR: SECRET_KEY must be at least 32 characters in production. "
                    f"Current length: {len(v)}. "
                    "Generate a secure key with: python -c \"import secrets; print(secrets.token_urlsafe(32))\""
                )

        return v

    # CORS
    cors_origins: str = "http://localhost:3000"

    # Email (Resend)
    resend_api_key: Optional[str] = None
    from_email: str = "noreply@ctlstlabs.com"

    # App
    app_name: str = "CTLST Labs"
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
