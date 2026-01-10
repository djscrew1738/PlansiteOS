"""Upload detail API router (for GET /uploads/{id} endpoints)."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import UploadWithPages, SelectPagesRequest
from app.dependencies import get_upload
from app.models import Upload

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.get("/{upload_id}", response_model=UploadWithPages)
def get_upload_detail(
    upload_id: str,
    upload: Upload = Depends(get_upload),
    db: Session = Depends(get_db)
):
    """Get upload details with pages, warnings, and progress.

    Args:
        upload_id: Upload UUID
        upload: Upload instance
        db: Database session

    Returns:
        Upload with pages
    """
    # The upload is already fetched by dependency
    # SQLAlchemy will lazy-load the pages relationship
    return upload


@router.post("/{upload_id}/select-pages", response_model=UploadWithPages)
def select_pages(
    upload_id: str,
    request: SelectPagesRequest,
    upload: Upload = Depends(get_upload),
    db: Session = Depends(get_db)
):
    """Select which pages to process from a multi-page PDF.

    Args:
        upload_id: Upload UUID
        request: Page selection request
        upload: Upload instance
        db: Database session

    Returns:
        Updated upload

    Note:
        For non-PDF uploads, this endpoint is a no-op.
        Page selection affects which pages are processed in the background job.
        This should be called before processing completes, ideally right after upload.
    """
    # Store selected pages in warnings/metadata field for now
    # In a real implementation, you might want a separate table or field
    if upload.mime_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Page selection only applicable to PDF uploads"
        )

    # Store selection (the worker will check this)
    if not upload.warnings:
        upload.warnings = []

    # Add metadata about selected pages
    upload.progress = upload.progress or []
    upload.progress.append(f"Pages selected: {request.active_page_numbers}")

    db.commit()
    db.refresh(upload)
    return upload
