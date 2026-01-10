"""FastAPI dependencies."""
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Project, Upload, Page
from uuid import UUID


def get_project(project_id: UUID, db: Session = Depends(get_db)) -> Project:
    """Get project by ID or raise 404.

    Args:
        project_id: Project UUID
        db: Database session

    Returns:
        Project instance

    Raises:
        HTTPException: If project not found
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found"
        )
    return project


def get_upload(upload_id: UUID, db: Session = Depends(get_db)) -> Upload:
    """Get upload by ID or raise 404.

    Args:
        upload_id: Upload UUID
        db: Database session

    Returns:
        Upload instance

    Raises:
        HTTPException: If upload not found
    """
    upload = db.query(Upload).filter(Upload.id == upload_id).first()
    if not upload:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Upload {upload_id} not found"
        )
    return upload


def get_page(page_id: UUID, db: Session = Depends(get_db)) -> Page:
    """Get page by ID or raise 404.

    Args:
        page_id: Page UUID
        db: Database session

    Returns:
        Page instance

    Raises:
        HTTPException: If page not found
    """
    page = db.query(Page).filter(Page.id == page_id).first()
    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Page {page_id} not found"
        )
    return page
