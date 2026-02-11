from pydantic_settings import BaseSettings
from pydantic import Field


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

    # ── Upload limits ────────────────────────────────────────────────────
    upload_max_bytes: int = Field(200 * 1024 * 1024, alias="UPLOAD_MAX_BYTES")
    upload_rate_limit: int = Field(10, alias="UPLOAD_RATE_LIMIT")
    upload_rate_window_seconds: int = Field(60, alias="UPLOAD_RATE_WINDOW_SECONDS")

    # ── PDF rendering ────────────────────────────────────────────────────
    pdf_max_pages: int = Field(500, alias="PDF_MAX_PAGES")
    pdf_page_batch_size: int = Field(5, alias="PDF_PAGE_BATCH_SIZE")
    pdf_render_dpi: int = Field(300, alias="PDF_RENDER_DPI")
    pdf_large_render_dpi: int = Field(200, alias="PDF_LARGE_RENDER_DPI")
    pdf_xlarge_render_dpi: int = Field(150, alias="PDF_XLARGE_RENDER_DPI")
    pdf_large_page_threshold: int = Field(20, alias="PDF_LARGE_PAGE_THRESHOLD")
    pdf_xlarge_page_threshold: int = Field(80, alias="PDF_XLARGE_PAGE_THRESHOLD")
    pdf_poppler_thread_count: int = Field(2, alias="PDF_POPPLER_THREAD_COUNT")

    # ── Image enhancement pipeline ───────────────────────────────────────
    # Which enhancement steps to run (comma-separated).
    # Options: deskew, auto_rotate, clahe, denoise, sharpen
    enhancement_pipeline: str = Field(
        "deskew,auto_rotate,clahe", alias="ENHANCEMENT_PIPELINE"
    )
    # Max absolute deskew angle (degrees).  Prevents mangling well-oriented pages.
    deskew_max_angle: float = Field(5.0, alias="DESKEW_MAX_ANGLE")
    # Downscale factor for analysis operations (deskew/rotate detection).
    # The analysis runs at 1/N resolution, then the correction is applied at full res.
    analysis_downscale: int = Field(4, alias="ANALYSIS_DOWNSCALE")
    # CLAHE contrast threshold – skip CLAHE if the image already has adequate contrast.
    clahe_skip_threshold: float = Field(40.0, alias="CLAHE_SKIP_THRESHOLD")
    # Blur detection threshold (Laplacian variance).
    blur_threshold: float = Field(100.0, alias="BLUR_THRESHOLD")
    # Minimum short-side pixels to NOT flag as low_resolution.
    min_resolution_short_side: int = Field(1500, alias="MIN_RESOLUTION_SHORT_SIDE")

    # ── Output format ────────────────────────────────────────────────────
    # "png" (lossless, large) or "webp" (lossy, ~5x smaller, fast decode).
    page_output_format: str = Field("webp", alias="PAGE_OUTPUT_FORMAT")
    page_output_quality: int = Field(90, alias="PAGE_OUTPUT_QUALITY")
    # Thumbnail settings
    thumb_max_dimension: int = Field(512, alias="THUMB_MAX_DIMENSION")
    thumb_quality: int = Field(80, alias="THUMB_QUALITY")

    # ── Per-page safety ──────────────────────────────────────────────────
    per_page_timeout_seconds: int = Field(120, alias="PER_PAGE_TIMEOUT_SECONDS")
    # Max pixel area (width*height) before we force-downscale a rendered page.
    # 100 megapixels = ~10000x10000.  Prevents OOM on oversized pages.
    max_page_pixels: int = Field(100_000_000, alias="MAX_PAGE_PIXELS")

    # ── Job / retry settings ─────────────────────────────────────────────
    processing_timeout_seconds: int = Field(900, alias="PROCESSING_TIMEOUT_SECONDS")
    upload_chunk_size: int = Field(10 * 1024 * 1024, alias="UPLOAD_CHUNK_SIZE")
    s3_upload_max_retries: int = Field(3, alias="S3_UPLOAD_MAX_RETRIES")
    s3_upload_retry_delay: float = Field(2.0, alias="S3_UPLOAD_RETRY_DELAY")
    # How often to commit progress to DB (every N pages).
    progress_commit_interval: int = Field(5, alias="PROGRESS_COMMIT_INTERVAL")
    # Max length of error_message stored in DB.
    max_error_message_length: int = Field(2000, alias="MAX_ERROR_MESSAGE_LENGTH")

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
