import uuid
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Boolean, Column, DateTime, Enum, Float, ForeignKey, Integer, String, JSON, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .db import Base


class FoundationType(str, PyEnum):
    SLAB = "SLAB"
    PIER_BEAM = "PIER_BEAM"
    UNKNOWN = "UNKNOWN"


class UploadStatus(str, PyEnum):
    UPLOADED = "UPLOADED"
    PROCESSING = "PROCESSING"
    READY = "READY"
    FAILED = "FAILED"


class PageStatus(str, PyEnum):
    READY = "READY"
    FAILED = "FAILED"


class PageLabel(str, PyEnum):
    FLOOR_PLAN = "FLOOR_PLAN"
    PLUMBING = "PLUMBING"
    ELEVATION = "ELEVATION"
    SITE = "SITE"
    OTHER = "OTHER"


class RealUnit(str, PyEnum):
    FT = "FT"
    IN = "IN"
    MM = "MM"


class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    address = Column(String, nullable=True)
    builder = Column(String, nullable=True)
    foundation_type = Column(Enum(FoundationType), nullable=False)
    floors = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    uploads = relationship("Upload", back_populates="project")


class Upload(Base):
    __tablename__ = "uploads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    original_filename = Column(String, nullable=False)
    mime_type = Column(String, nullable=False)
    size_bytes = Column(Integer, nullable=False)
    storage_key_original = Column(String, nullable=False)
    status = Column(Enum(UploadStatus), nullable=False)
    revision_label = Column(String, nullable=True)
    error_message = Column(String, nullable=True)
    warnings = Column(JSON, nullable=True)
    progress = Column(JSON, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    project = relationship("Project", back_populates="uploads")
    pages = relationship("Page", back_populates="upload")


class Page(Base):
    __tablename__ = "pages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    upload_id = Column(UUID(as_uuid=True), ForeignKey("uploads.id"), nullable=False)
    page_number = Column(Integer, nullable=False)
    width_px = Column(Integer, nullable=False)
    height_px = Column(Integer, nullable=False)
    dpi_estimated = Column(Integer, nullable=True)
    storage_key_page_png = Column(String, nullable=False)
    storage_key_page_thumb = Column(String, nullable=True)
    status = Column(Enum(PageStatus), nullable=False)
    label = Column(Enum(PageLabel), nullable=False, default=PageLabel.OTHER)
    is_selected = Column(Boolean, nullable=False, default=True)
    warnings = Column(JSON, nullable=True)

    upload = relationship("Upload", back_populates="pages")
    calibration = relationship("Calibration", back_populates="page", uselist=False)


class Calibration(Base):
    __tablename__ = "calibrations"
    __table_args__ = (UniqueConstraint("page_id", name="uniq_calibration_page"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    page_id = Column(UUID(as_uuid=True), ForeignKey("pages.id"), nullable=False)
    p1x = Column(Integer, nullable=False)
    p1y = Column(Integer, nullable=False)
    p2x = Column(Integer, nullable=False)
    p2y = Column(Integer, nullable=False)
    real_distance = Column(Float, nullable=False)
    real_unit = Column(Enum(RealUnit), nullable=False)
    pixels_per_unit = Column(Float, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    page = relationship("Page", back_populates="calibration")
