from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from .models import (
    FoundationType,
    UploadStatus,
    PageStatus,
    RealUnit,
    PageLabel,
    PipelineSystem,
    PipelinePhase,
    NodeType,
)


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
    label: PageLabel
    isSelected: bool = Field(alias="is_selected")
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
    revisionLabel: Optional[str] = Field(alias="revision_label")
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
    labels: Optional[dict] = None
    revisionLabel: Optional[str] = None


class PageUpdate(BaseModel):
    label: Optional[PageLabel] = None
    isSelected: Optional[bool] = None


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


class PipelineCreate(BaseModel):
    projectId: str
    pageId: str
    systemType: PipelineSystem
    name: str
    phase: PipelinePhase


class PipelineOut(BaseModel):
    id: str
    projectId: str = Field(alias="project_id")
    pageId: str = Field(alias="page_id")
    systemType: PipelineSystem = Field(alias="system_type")
    name: str
    phase: PipelinePhase
    createdAt: datetime = Field(alias="created_at")

    class Config:
        populate_by_name = True


class NodeCreate(BaseModel):
    pipelineId: str
    nodeType: NodeType
    x: float
    y: float
    metadata: Optional[dict] = None


class NodeOut(BaseModel):
    id: str
    pipelineId: str = Field(alias="pipeline_id")
    nodeType: NodeType = Field(alias="node_type")
    x: float
    y: float
    metadata: Optional[dict] = Field(alias="metadata_json")
    createdAt: datetime = Field(alias="created_at")

    class Config:
        populate_by_name = True


class SegmentCreate(BaseModel):
    pipelineId: str
    points: List[List[float]]
    diameter: str
    material: str
    slope: Optional[float] = None
    depth: Optional[float] = None
    phase: PipelinePhase
    tags: Optional[dict] = None


class SegmentOut(BaseModel):
    id: str
    pipelineId: str = Field(alias="pipeline_id")
    points: List[List[float]]
    diameter: str
    material: str
    slope: Optional[float]
    depth: Optional[float]
    phase: PipelinePhase
    tags: Optional[dict]
    createdAt: datetime = Field(alias="created_at")

    class Config:
        populate_by_name = True


class PricingItemCreate(BaseModel):
    projectId: str
    name: str
    unit: str


class PricingItemOut(BaseModel):
    id: str
    projectId: str = Field(alias="project_id")
    name: str
    unit: str
    createdAt: datetime = Field(alias="created_at")

    class Config:
        populate_by_name = True


class PricingHistoryCreate(BaseModel):
    itemId: str
    price: float
    source: Optional[str] = None


class PricingHistoryOut(BaseModel):
    id: str
    itemId: str = Field(alias="item_id")
    price: float
    source: Optional[str]
    effectiveDate: datetime = Field(alias="effective_date")

    class Config:
        populate_by_name = True


class QuickBooksConfigCreate(BaseModel):
    projectId: str
    companyId: str
    accessToken: Optional[str] = None
    refreshToken: Optional[str] = None
    status: str = "DISCONNECTED"


class QuickBooksConfigOut(BaseModel):
    id: str
    projectId: str = Field(alias="project_id")
    companyId: str = Field(alias="company_id")
    status: str
    createdAt: datetime = Field(alias="created_at")

    class Config:
        populate_by_name = True
