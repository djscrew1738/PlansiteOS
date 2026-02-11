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

    # Large-PDF processing settings
    pdf_max_pages: int = Field(200, alias="PDF_MAX_PAGES")
    pdf_page_batch_size: int = Field(5, alias="PDF_PAGE_BATCH_SIZE")
    pdf_render_dpi: int = Field(350, alias="PDF_RENDER_DPI")
    pdf_large_render_dpi: int = Field(200, alias="PDF_LARGE_RENDER_DPI")
    pdf_large_page_threshold: int = Field(20, alias="PDF_LARGE_PAGE_THRESHOLD")
    upload_chunk_size: int = Field(10 * 1024 * 1024, alias="UPLOAD_CHUNK_SIZE")
    processing_timeout_seconds: int = Field(600, alias="PROCESSING_TIMEOUT_SECONDS")

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
