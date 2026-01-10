from pydantic_settings import BaseSettings
from pydantic import AnyUrl, Field


class Settings(BaseSettings):
    app_name: str = "plansiteos"
    environment: str = "dev"
    cors_origin: str = Field("http://localhost:5173", alias="CORS_ORIGIN")
    database_url: str = Field(..., alias="DATABASE_URL")
    redis_url: str = Field(..., alias="REDIS_URL")

    s3_endpoint: str = Field(..., alias="S3_ENDPOINT")
    s3_access_key: str = Field(..., alias="S3_ACCESS_KEY")
    s3_secret_key: str = Field(..., alias="S3_SECRET_KEY")
    s3_bucket: str = Field(..., alias="S3_BUCKET")
    s3_region: str = Field("us-east-1", alias="S3_REGION")
    s3_secure: bool = Field(False, alias="S3_SECURE")

    upload_max_bytes: int = Field(200 * 1024 * 1024, alias="UPLOAD_MAX_BYTES")
    upload_rate_limit: int = Field(10, alias="UPLOAD_RATE_LIMIT")
    upload_rate_window_seconds: int = Field(60, alias="UPLOAD_RATE_WINDOW_SECONDS")

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
