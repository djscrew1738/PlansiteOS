"""Summary API endpoints for blueprint upload reports."""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime
import json
import csv
import io

from app.database import get_db
from app.services.summary_service import SummaryService
from app.schemas.summary import (
    UploadSummary, ProjectSummary, DashboardSummary,
    ExportRequest, ExportFormat
)

router = APIRouter(prefix="/summary", tags=["summary"])


@router.get("/dashboard", response_model=DashboardSummary)
def get_dashboard(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get high-level dashboard statistics.

    Args:
        limit: Number of recent uploads to include
        db: Database session

    Returns:
        Dashboard summary with aggregate metrics
    """
    service = SummaryService(db)
    return service.get_dashboard_summary(limit=limit)


@router.get("/projects/{project_id}", response_model=ProjectSummary)
def get_project_summary(
    project_id: UUID,
    db: Session = Depends(get_db)
):
    """Get comprehensive summary for a project.

    Args:
        project_id: Project UUID
        db: Database session

    Returns:
        Project summary with all uploads and metrics
    """
    service = SummaryService(db)
    summary = service.get_project_summary(project_id)

    if not summary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found"
        )

    return summary


@router.get("/uploads/{upload_id}", response_model=UploadSummary)
def get_upload_summary(
    upload_id: UUID,
    db: Session = Depends(get_db)
):
    """Get detailed summary for an upload.

    Args:
        upload_id: Upload UUID
        db: Database session

    Returns:
        Upload summary with pages and quality metrics
    """
    service = SummaryService(db)
    summary = service.get_upload_summary(upload_id)

    if not summary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Upload {upload_id} not found"
        )

    return summary


@router.post("/projects/{project_id}/export")
def export_project_summary(
    project_id: UUID,
    request: ExportRequest,
    db: Session = Depends(get_db)
):
    """Export project summary to file.

    Args:
        project_id: Project UUID
        request: Export options
        db: Database session

    Returns:
        Downloadable file (JSON or CSV)
    """
    service = SummaryService(db)
    summary = service.get_project_summary(project_id)

    if not summary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found"
        )

    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"project_summary_{project_id}_{timestamp}"

    if request.format == ExportFormat.JSON:
        data = summary.model_dump(mode="json")
        if not request.include_pages:
            for upload in data.get("uploads", []):
                upload.pop("pages", None)
        if not request.include_warnings:
            data.pop("total_warnings", None)
            for upload in data.get("uploads", []):
                upload.pop("warnings", None)
                upload.pop("warning_types", None)

        return JSONResponse(
            content=data,
            headers={
                "Content-Disposition": f"attachment; filename={filename}.json"
            }
        )

    elif request.format == ExportFormat.CSV:
        output = io.StringIO()
        writer = csv.writer(output)

        # Header
        writer.writerow([
            "Upload ID", "Filename", "Status", "File Type", "Size (MB)",
            "Pages", "Calibrated", "Quality Score", "Quality Grade",
            "Warnings", "Uploaded At"
        ])

        # Data rows
        for upload in summary.uploads:
            writer.writerow([
                str(upload.upload_id),
                upload.filename,
                upload.status,
                upload.file_type,
                upload.file_size_mb,
                upload.total_pages,
                upload.calibrated_pages,
                upload.quality_score,
                upload.quality_grade.value,
                upload.total_warnings,
                upload.uploaded_at.isoformat()
            ])

        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename={filename}.csv"
            }
        )


@router.post("/uploads/{upload_id}/export")
def export_upload_summary(
    upload_id: UUID,
    request: ExportRequest,
    db: Session = Depends(get_db)
):
    """Export upload summary to file.

    Args:
        upload_id: Upload UUID
        request: Export options
        db: Database session

    Returns:
        Downloadable file (JSON or CSV)
    """
    service = SummaryService(db)
    summary = service.get_upload_summary(upload_id)

    if not summary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Upload {upload_id} not found"
        )

    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"upload_summary_{upload_id}_{timestamp}"

    if request.format == ExportFormat.JSON:
        data = summary.model_dump(mode="json")
        if not request.include_pages:
            data.pop("pages", None)
        if not request.include_warnings:
            data.pop("warning_types", None)
            data.pop("total_warnings", None)

        return JSONResponse(
            content=data,
            headers={
                "Content-Disposition": f"attachment; filename={filename}.json"
            }
        )

    elif request.format == ExportFormat.CSV:
        output = io.StringIO()
        writer = csv.writer(output)

        # Page-level CSV
        writer.writerow([
            "Page Number", "Dimensions", "DPI", "Calibrated",
            "Scale Info", "Warning Count", "Warnings"
        ])

        for page in summary.pages:
            writer.writerow([
                page.page_number,
                page.dimensions,
                page.dpi or "N/A",
                "Yes" if page.is_calibrated else "No",
                page.scale_info or "N/A",
                page.warning_count,
                "; ".join(page.warnings) if page.warnings else ""
            ])

        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename={filename}.csv"
            }
        )
