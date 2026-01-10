"""Summary module schemas for blueprint upload reports."""
from pydantic import BaseModel, computed_field
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from enum import Enum


class QualityGrade(str, Enum):
    """Overall quality assessment grade."""
    EXCELLENT = "EXCELLENT"
    GOOD = "GOOD"
    FAIR = "FAIR"
    POOR = "POOR"


class PageSummary(BaseModel):
    """Summary data for a single page."""
    page_id: UUID
    page_number: int
    dimensions: str
    dpi: Optional[int]
    is_calibrated: bool
    scale_info: Optional[str]
    warning_count: int
    warnings: List[str]

    class Config:
        from_attributes = True


class UploadSummary(BaseModel):
    """Comprehensive summary for a single upload."""
    upload_id: UUID
    project_id: UUID
    filename: str
    file_type: str
    file_size_mb: float
    status: str
    uploaded_at: datetime

    # Page metrics
    total_pages: int
    calibrated_pages: int
    pages_with_warnings: int

    # Quality assessment
    quality_grade: QualityGrade
    quality_score: int  # 0-100

    # Warnings aggregate
    total_warnings: int
    warning_types: dict[str, int]

    # Pages detail
    pages: List[PageSummary]

    # Processing info
    processing_duration_seconds: Optional[float]
    error_message: Optional[str]

    class Config:
        from_attributes = True


class ProjectSummary(BaseModel):
    """Aggregate summary for an entire project."""
    project_id: UUID
    project_name: str
    address: Optional[str]
    builder: Optional[str]
    foundation_type: str
    floors: int
    created_at: datetime

    # Upload metrics
    total_uploads: int
    completed_uploads: int
    failed_uploads: int
    processing_uploads: int

    # Page metrics
    total_pages: int
    calibrated_pages: int

    # Quality metrics
    average_quality_score: float
    uploads_with_warnings: int
    total_warnings: int

    # Storage
    total_size_mb: float

    # Uploads detail
    uploads: List[UploadSummary]

    class Config:
        from_attributes = True


class DashboardSummary(BaseModel):
    """High-level dashboard statistics."""
    total_projects: int
    total_uploads: int
    total_pages: int
    total_calibrations: int

    # Status breakdown
    uploads_by_status: dict[str, int]

    # Quality overview
    average_quality_score: float
    uploads_with_warnings: int

    # Storage
    total_storage_mb: float

    # Recent activity
    recent_uploads: List[UploadSummary]

    # Timestamp
    generated_at: datetime

    class Config:
        from_attributes = True


class ExportFormat(str, Enum):
    """Supported export formats."""
    JSON = "json"
    CSV = "csv"


class ExportRequest(BaseModel):
    """Request for exporting summary data."""
    format: ExportFormat = ExportFormat.JSON
    include_pages: bool = True
    include_warnings: bool = True
