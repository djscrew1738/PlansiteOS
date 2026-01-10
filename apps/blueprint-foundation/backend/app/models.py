"""SQLAlchemy models for blueprint upload system."""
import enum
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, ForeignKey, DateTime, Enum, Text, JSON, BigInteger
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import uuid

Base = declarative_base()


class FoundationType(str, enum.Enum):
    """Foundation type enumeration."""
    SLAB = "SLAB"
    PIER_BEAM = "PIER_BEAM"
    UNKNOWN = "UNKNOWN"


class UploadStatus(str, enum.Enum):
    """Upload processing status."""
    UPLOADED = "UPLOADED"
    PROCESSING = "PROCESSING"
    READY = "READY"
    FAILED = "FAILED"


class PageStatus(str, enum.Enum):
    """Page processing status."""
    READY = "READY"
    FAILED = "FAILED"


class RealUnit(str, enum.Enum):
    """Real-world measurement units."""
    FT = "FT"
    IN = "IN"
    MM = "MM"


class Project(Base):
    """Project model."""
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    address = Column(String(500), nullable=True)
    builder = Column(String(255), nullable=True)
    foundation_type = Column(Enum(FoundationType), nullable=False, default=FoundationType.UNKNOWN)
    floors = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    uploads = relationship("Upload", back_populates="project", cascade="all, delete-orphan")


class Upload(Base):
    """Upload model."""
    __tablename__ = "uploads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    original_filename = Column(String(500), nullable=False)
    mime_type = Column(String(100), nullable=False)
    size_bytes = Column(BigInteger, nullable=False)
    storage_key_original = Column(String(1000), nullable=False)
    status = Column(Enum(UploadStatus), nullable=False, default=UploadStatus.UPLOADED)
    error_message = Column(Text, nullable=True)
    warnings = Column(JSON, nullable=True)  # List of warning strings
    progress = Column(JSON, nullable=True)  # Array of step names or structured progress
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="uploads")
    pages = relationship("Page", back_populates="upload", cascade="all, delete-orphan")


class Page(Base):
    """Page model."""
    __tablename__ = "pages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    upload_id = Column(UUID(as_uuid=True), ForeignKey("uploads.id"), nullable=False)
    page_number = Column(Integer, nullable=False)
    width_px = Column(Integer, nullable=False)
    height_px = Column(Integer, nullable=False)
    dpi_estimated = Column(Integer, nullable=True)
    storage_key_page_png = Column(String(1000), nullable=False)
    storage_key_page_thumb = Column(String(1000), nullable=True)
    status = Column(Enum(PageStatus), nullable=False, default=PageStatus.READY)
    warnings = Column(JSON, nullable=True)  # List of warning strings
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    upload = relationship("Upload", back_populates="pages")
    calibration = relationship("Calibration", back_populates="page", uselist=False, cascade="all, delete-orphan")


class Calibration(Base):
    """Calibration model."""
    __tablename__ = "calibrations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    page_id = Column(UUID(as_uuid=True), ForeignKey("pages.id"), nullable=False, unique=True)
    p1x = Column(Integer, nullable=False)
    p1y = Column(Integer, nullable=False)
    p2x = Column(Integer, nullable=False)
    p2y = Column(Integer, nullable=False)
    real_distance = Column(Float, nullable=False)
    real_unit = Column(Enum(RealUnit), nullable=False)
    pixels_per_unit = Column(Float, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    page = relationship("Page", back_populates="calibration")
