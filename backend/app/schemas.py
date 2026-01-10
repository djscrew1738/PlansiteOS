from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from .models import FoundationType, UploadStatus, PageStatus, RealUnit


class ProjectCreate(BaseModel):
    name: str
    address: Optional[str] = None
    builder: Optional[str] = None
    foundationType: FoundationType
    floors: int = 1


class ProjectOut(BaseModel):
    id: str
    name: str
    address: Optional[str]
    builder: Optional[str]
    foundationType: FoundationType = Field(alias="foundation_type")
    floors: int
    createdAt: datetime = Field(alias="created_at")

    class Config:
        populate_by_name = True


class PageOut(BaseModel):
    id: str
    uploadId: str = Field(alias="upload_id")
    pageNumber: int = Field(alias="page_number")
    widthPx: int = Field(alias="width_px")
    heightPx: int = Field(alias="height_px")
    dpiEstimated: Optional[int] = Field(alias="dpi_estimated")
    storageKeyPagePng: str = Field(alias="storage_key_page_png")
    storageKeyPageThumb: Optional[str] = Field(alias="storage_key_page_thumb")
    status: PageStatus
    warnings: Optional[dict]

    class Config:
        populate_by_name = True


class UploadOut(BaseModel):
    id: str
    projectId: str = Field(alias="project_id")
    originalFilename: str = Field(alias="original_filename")
    mimeType: str = Field(alias="mime_type")
    sizeBytes: int = Field(alias="size_bytes")
    storageKeyOriginal: str = Field(alias="storage_key_original")
    status: UploadStatus
    errorMessage: Optional[str] = Field(alias="error_message")
    warnings: Optional[dict]
    progress: Optional[dict]
    createdAt: datetime = Field(alias="created_at")
    pages: List[PageOut] = []

    class Config:
        populate_by_name = True


class UploadCreateResponse(BaseModel):
    uploadId: str
    status: UploadStatus


class PageSelection(BaseModel):
    activePageNumbers: List[int]


class CalibrationIn(BaseModel):
    p1x: int
    p1y: int
    p2x: int
    p2y: int
    realDistance: float
    realUnit: RealUnit


class CalibrationOut(BaseModel):
    id: str
    pageId: str = Field(alias="page_id")
    p1x: int
    p1y: int
    p2x: int
    p2y: int
    realDistance: float = Field(alias="real_distance")
    realUnit: RealUnit = Field(alias="real_unit")
    pixelsPerUnit: float = Field(alias="pixels_per_unit")
    createdAt: datetime = Field(alias="created_at")

    class Config:
        populate_by_name = True


class HealthOut(BaseModel):
    database: bool
    redis: bool
    storage: bool
