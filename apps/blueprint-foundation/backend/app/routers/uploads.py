"""Uploads API router."""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Upload, UploadStatus
from app.schemas import UploadResponse, UploadWithPages, SelectPagesRequest
from app.dependencies import get_project, get_upload
from app.storage import storage_client
from app.config import settings
from app.queue import enqueue_task
import re
import os
from uuid import UUID

router = APIRouter(prefix="/projects/{project_id}/uploads", tags=["uploads"])


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent path traversal.

    Args:
        filename: Original filename

    Returns:
        Sanitized filename
    """
    # Remove path components
    filename = os.path.basename(filename)
    # Remove special characters except alphanumeric, dots, dashes, underscores
    filename = re.sub(r'[^a-zA-Z0-9._-]', '_', filename)
    # Limit length
    if len(filename) > 200:
        name, ext = os.path.splitext(filename)
        filename = name[:200-len(ext)] + ext
    return filename


@router.post("", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def create_upload(
    project_id: str,
    file: UploadFile = File(...),
    project = Depends(get_project),
    db: Session = Depends(get_db)
):
    """Upload a blueprint file.

    Args:
        project_id: Project UUID
        file: Uploaded file
        project: Project instance
        db: Database session

    Returns:
        Upload record with job status
    """
    # Validate file size
    content = await file.read()
    if len(content) > settings.max_upload_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum of {settings.max_upload_size} bytes"
        )

    # Validate MIME type
    mime_type = file.content_type or "application/octet-stream"
    if mime_type not in settings.allowed_mime_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type {mime_type} not allowed. Allowed types: {', '.join(settings.allowed_mime_types)}"
        )

    # Sanitize filename
    safe_filename = sanitize_filename(file.filename or "upload")

    # Create upload record
    upload = Upload(
        project_id=project.id,
        original_filename=safe_filename,
        mime_type=mime_type,
        size_bytes=len(content),
        storage_key_original="",  # Will be set below
        status=UploadStatus.UPLOADED,
    )
    db.add(upload)
    db.flush()  # Get upload ID

    # Generate storage key
    storage_key = f"projects/{project.id}/uploads/{upload.id}/original/{safe_filename}"
    upload.storage_key_original = storage_key

    # Upload to object storage
    success = storage_client.upload_file(storage_key, content, mime_type)
    if not success:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload file to storage"
        )

    db.commit()
    db.refresh(upload)

    # Enqueue background processing job
    from worker.tasks import process_upload
    enqueue_task(process_upload, str(upload.id))

    return upload


@router.get("", response_model=list[UploadResponse])
def list_uploads(
    project_id: str,
    project = Depends(get_project),
    db: Session = Depends(get_db)
):
    """List all uploads for a project.

    Args:
        project_id: Project UUID
        project: Project instance
        db: Database session

    Returns:
        List of uploads
    """
    uploads = db.query(Upload).filter(Upload.project_id == project.id).all()
    return uploads
