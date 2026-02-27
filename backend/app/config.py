from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://rishivyas@localhost:5432/claude_analytics"
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiry_hours: int = 24
    encryption_key: str = "change-me-32-byte-key-in-prod!!"  # Must be 32 bytes for AES-256
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    # Pricing per 1M tokens (USD) — updated for current Claude models
    pricing: dict[str, dict[str, float]] = {
        "claude-opus-4-6": {"input": 15.0, "output": 75.0},
        "claude-sonnet-4-6": {"input": 3.0, "output": 15.0},
        "claude-haiku-4-5-20251001": {"input": 0.80, "output": 4.0},
        # Legacy models
        "claude-sonnet-4-20250514": {"input": 3.0, "output": 15.0},
        "claude-3-5-sonnet-20241022": {"input": 3.0, "output": 15.0},
        "claude-3-5-haiku-20241022": {"input": 0.80, "output": 4.0},
        "claude-3-opus-20240229": {"input": 15.0, "output": 75.0},
    }

    model_config = {"env_prefix": "CUA_"}


settings = Settings()
