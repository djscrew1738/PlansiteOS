"""Pydantic schemas for API request/response validation."""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from app.models import FoundationType, UploadStatus, PageStatus, RealUnit


# Project schemas
class ProjectCreate(BaseModel):
    """Project creation schema."""
    name: str = Field(..., min_length=1, max_length=255)
    address: Optional[str] = Field(None, max_length=500)
    builder: Optional[str] = Field(None, max_length=255)
    foundation_type: FoundationType = FoundationType.UNKNOWN
    floors: int = Field(1, ge=1, le=10)


class ProjectResponse(BaseModel):
    """Project response schema."""
    id: UUID
    name: str
    address: Optional[str]
    builder: Optional[str]
    foundation_type: FoundationType
    floors: int
    created_at: datetime

    class Config:
        from_attributes = True


# Upload schemas
class UploadResponse(BaseModel):
    """Upload response schema."""
    id: UUID
    project_id: UUID
    original_filename: str
    mime_type: str
    size_bytes: int
    storage_key_original: str
    status: UploadStatus
    error_message: Optional[str]
    warnings: Optional[List[str]]
    progress: Optional[List[str]]
    created_at: datetime

    class Config:
        from_attributes = True


class UploadWithPages(UploadResponse):
    """Upload with pages response."""
    pages: List["PageResponse"]


class SelectPagesRequest(BaseModel):
    """Select pages request."""
    active_page_numbers: List[int] = Field(..., min_items=1)


# Page schemas
class PageResponse(BaseModel):
    """Page response schema."""
    id: UUID
    upload_id: UUID
    page_number: int
    width_px: int
    height_px: int
    dpi_estimated: Optional[int]
    storage_key_page_png: str
    storage_key_page_thumb: Optional[str]
    status: PageStatus
    warnings: Optional[List[str]]
    created_at: datetime

    class Config:
        from_attributes = True


class SignedUrlResponse(BaseModel):
    """Signed URL response."""
    url: str
    expires_at: datetime


# Calibration schemas
class CalibrationCreate(BaseModel):
    """Calibration creation schema."""
    p1x: int = Field(..., ge=0)
    p1y: int = Field(..., ge=0)
    p2x: int = Field(..., ge=0)
    p2y: int = Field(..., ge=0)
    real_distance: float = Field(..., gt=0)
    real_unit: RealUnit


class CalibrationResponse(BaseModel):
    """Calibration response schema."""
    id: UUID
    page_id: UUID
    p1x: int
    p1y: int
    p2x: int
    p2y: int
    real_distance: float
    real_unit: RealUnit
    pixels_per_unit: float
    created_at: datetime

    class Config:
        from_attributes = True


# Health check schema
class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    database: str
    redis: str
    storage: str


# Update forward refs
UploadWithPages.model_rebuild()
