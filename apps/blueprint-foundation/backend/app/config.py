"""Application configuration."""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings."""

    # Application
    app_name: str = "Blueprint Upload Foundation"
    debug: bool = False
    api_prefix: str = "/api"

    # CORS
    cors_origins: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Database
    database_url: str = "postgresql://postgres:postgres@localhost:5432/blueprints"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Object Storage (MinIO/S3)
    storage_endpoint: str = "localhost:9000"
    storage_access_key: str = "minioadmin"
    storage_secret_key: str = "minioadmin"
    storage_bucket: str = "blueprints"
    storage_secure: bool = False  # Use HTTPS
    storage_region: str = "us-east-1"

    # Upload limits
    max_upload_size: int = 100 * 1024 * 1024  # 100MB
    allowed_mime_types: List[str] = [
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/heic",  # Optional HEIC support
    ]

    # Rate limiting
    rate_limit_per_minute: int = 10

    # Processing
    image_target_dpi: int = 300
    thumbnail_max_size: int = 400  # Max dimension for thumbnail
    blur_threshold: float = 100.0  # Laplacian variance threshold
    low_res_threshold: int = 1800  # Minimum pixel dimension

    # Signed URL expiry (seconds)
    signed_url_expiry: int = 3600  # 1 hour

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
