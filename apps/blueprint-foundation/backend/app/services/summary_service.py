"""Summary computation service for blueprint uploads."""
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from datetime import datetime
from uuid import UUID

from app.models import Project, Upload, Page, Calibration, UploadStatus
from app.schemas.summary import (
    PageSummary, UploadSummary, ProjectSummary,
    DashboardSummary, QualityGrade
)


class SummaryService:
    """Service for computing blueprint upload summaries."""

    def __init__(self, db: Session):
        self.db = db

    def get_page_summary(self, page: Page) -> PageSummary:
        """Generate summary for a single page."""
        calibration = self.db.query(Calibration).filter(
            Calibration.page_id == page.id
        ).first()

        scale_info = None
        if calibration:
            scale_info = f"{calibration.pixels_per_unit:.2f} px/{calibration.real_unit.value}"

        warnings = page.warnings or []

        return PageSummary(
            page_id=page.id,
            page_number=page.page_number,
            dimensions=f"{page.width_px}x{page.height_px}",
            dpi=page.dpi_estimated,
            is_calibrated=calibration is not None,
            scale_info=scale_info,
            warning_count=len(warnings),
            warnings=warnings
        )

    def compute_quality_score(self, upload: Upload, pages: List[Page]) -> tuple[int, QualityGrade]:
        """Compute quality score (0-100) and grade for an upload."""
        if not pages:
            return 0, QualityGrade.POOR

        score = 100

        # Deduct for upload-level warnings
        upload_warnings = upload.warnings or []
        score -= len(upload_warnings) * 5

        # Deduct for page-level issues
        for page in pages:
            page_warnings = page.warnings or []
            score -= len(page_warnings) * 3

            # Bonus for calibrated pages
            calibration = self.db.query(Calibration).filter(
                Calibration.page_id == page.id
            ).first()
            if calibration:
                score += 5

            # Deduct for low DPI
            if page.dpi_estimated and page.dpi_estimated < 200:
                score -= 10

        # Normalize score
        score = max(0, min(100, score))

        # Determine grade
        if score >= 90:
            grade = QualityGrade.EXCELLENT
        elif score >= 70:
            grade = QualityGrade.GOOD
        elif score >= 50:
            grade = QualityGrade.FAIR
        else:
            grade = QualityGrade.POOR

        return score, grade

    def categorize_warnings(self, warnings: List[str]) -> dict[str, int]:
        """Categorize warnings by type."""
        categories = {
            "blur": 0,
            "low_resolution": 0,
            "processing": 0,
            "other": 0
        }

        for warning in warnings:
            lower = warning.lower()
            if "blur" in lower:
                categories["blur"] += 1
            elif "resolution" in lower or "low res" in lower:
                categories["low_resolution"] += 1
            elif "process" in lower or "failed" in lower:
                categories["processing"] += 1
            else:
                categories["other"] += 1

        return {k: v for k, v in categories.items() if v > 0}

    def get_upload_summary(self, upload_id: UUID) -> Optional[UploadSummary]:
        """Generate comprehensive summary for an upload."""
        upload = self.db.query(Upload).filter(Upload.id == upload_id).first()
        if not upload:
            return None

        pages = self.db.query(Page).filter(Page.upload_id == upload_id).all()

        # Compute metrics
        calibrated_count = self.db.query(Calibration).join(Page).filter(
            Page.upload_id == upload_id
        ).count()

        # Collect all warnings
        all_warnings = list(upload.warnings or [])
        pages_with_warnings = 0
        for page in pages:
            if page.warnings:
                all_warnings.extend(page.warnings)
                pages_with_warnings += 1

        quality_score, quality_grade = self.compute_quality_score(upload, pages)

        # Build page summaries
        page_summaries = [self.get_page_summary(page) for page in pages]

        return UploadSummary(
            upload_id=upload.id,
            project_id=upload.project_id,
            filename=upload.original_filename,
            file_type=upload.mime_type.split("/")[-1].upper(),
            file_size_mb=round(upload.size_bytes / (1024 * 1024), 2),
            status=upload.status.value,
            uploaded_at=upload.created_at,
            total_pages=len(pages),
            calibrated_pages=calibrated_count,
            pages_with_warnings=pages_with_warnings,
            quality_grade=quality_grade,
            quality_score=quality_score,
            total_warnings=len(all_warnings),
            warning_types=self.categorize_warnings(all_warnings),
            pages=page_summaries,
            processing_duration_seconds=None,  # TODO: track in worker
            error_message=upload.error_message
        )

    def get_project_summary(self, project_id: UUID) -> Optional[ProjectSummary]:
        """Generate aggregate summary for a project."""
        project = self.db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return None

        uploads = self.db.query(Upload).filter(Upload.project_id == project_id).all()

        # Status counts
        status_counts = {
            "completed": 0,
            "failed": 0,
            "processing": 0
        }

        upload_summaries = []
        total_warnings = 0
        uploads_with_warnings = 0
        quality_scores = []

        for upload in uploads:
            summary = self.get_upload_summary(upload.id)
            if summary:
                upload_summaries.append(summary)
                quality_scores.append(summary.quality_score)
                total_warnings += summary.total_warnings
                if summary.total_warnings > 0:
                    uploads_with_warnings += 1

            if upload.status == UploadStatus.READY:
                status_counts["completed"] += 1
            elif upload.status == UploadStatus.FAILED:
                status_counts["failed"] += 1
            elif upload.status == UploadStatus.PROCESSING:
                status_counts["processing"] += 1

        # Aggregate metrics
        total_pages = self.db.query(Page).join(Upload).filter(
            Upload.project_id == project_id
        ).count()

        calibrated_pages = self.db.query(Calibration).join(Page).join(Upload).filter(
            Upload.project_id == project_id
        ).count()

        total_size = sum(u.size_bytes for u in uploads)

        return ProjectSummary(
            project_id=project.id,
            project_name=project.name,
            address=project.address,
            builder=project.builder,
            foundation_type=project.foundation_type.value,
            floors=project.floors,
            created_at=project.created_at,
            total_uploads=len(uploads),
            completed_uploads=status_counts["completed"],
            failed_uploads=status_counts["failed"],
            processing_uploads=status_counts["processing"],
            total_pages=total_pages,
            calibrated_pages=calibrated_pages,
            average_quality_score=sum(quality_scores) / len(quality_scores) if quality_scores else 0,
            uploads_with_warnings=uploads_with_warnings,
            total_warnings=total_warnings,
            total_size_mb=round(total_size / (1024 * 1024), 2),
            uploads=upload_summaries
        )

    def get_dashboard_summary(self, limit: int = 10) -> DashboardSummary:
        """Generate high-level dashboard statistics."""
        # Counts
        total_projects = self.db.query(Project).count()
        total_uploads = self.db.query(Upload).count()
        total_pages = self.db.query(Page).count()
        total_calibrations = self.db.query(Calibration).count()

        # Status breakdown
        status_counts = dict(
            self.db.query(Upload.status, func.count(Upload.id))
            .group_by(Upload.status)
            .all()
        )
        uploads_by_status = {k.value: v for k, v in status_counts.items()}

        # Storage
        total_storage = self.db.query(func.sum(Upload.size_bytes)).scalar() or 0

        # Quality and warnings
        uploads_with_warnings = self.db.query(Upload).filter(
            Upload.warnings.isnot(None)
        ).count()

        # Recent uploads
        recent = self.db.query(Upload).order_by(
            Upload.created_at.desc()
        ).limit(limit).all()

        recent_summaries = []
        quality_scores = []
        for upload in recent:
            summary = self.get_upload_summary(upload.id)
            if summary:
                recent_summaries.append(summary)
                quality_scores.append(summary.quality_score)

        return DashboardSummary(
            total_projects=total_projects,
            total_uploads=total_uploads,
            total_pages=total_pages,
            total_calibrations=total_calibrations,
            uploads_by_status=uploads_by_status,
            average_quality_score=sum(quality_scores) / len(quality_scores) if quality_scores else 0,
            uploads_with_warnings=uploads_with_warnings,
            total_storage_mb=round(total_storage / (1024 * 1024), 2),
            recent_uploads=recent_summaries,
            generated_at=datetime.utcnow()
        )
