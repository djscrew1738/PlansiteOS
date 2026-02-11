import gc
import json
import logging
import os
import shutil
import tempfile
from sqlalchemy.orm import Session
from .db import SessionLocal
from .models import Upload, UploadStatus, Page, PageStatus
from .processor import get_pdf_page_count, process_file
from .storage import storage_client

logger = logging.getLogger(__name__)


def _update_progress(
    db: Session,
    upload: Upload,
    status_list,
    current_step,
    *,
    pages_done: int = 0,
    pages_total: int = 0,
):
    """Persist progress information on the upload row.

    The optional *pages_done* / *pages_total* fields allow the frontend to
    display a fine-grained progress bar when processing large PDFs.
    """
    progress = {
        "steps": status_list,
        "current": current_step,
    }
    if pages_total > 0:
        progress["pagesDone"] = pages_done
        progress["pagesTotal"] = pages_total
        progress["pagesPercent"] = round(pages_done / pages_total * 100) if pages_total else 0
    upload.progress = progress
    db.add(upload)
    db.commit()


def process_upload(upload_id: str):
    steps = [
        "queued",
        "fetching",
        "converting",
        "enhancing",
        "uploading_pages",
        "writing_db",
        "done",
    ]
    db = SessionLocal()
    temp_dir = None
    try:
        upload = db.query(Upload).filter(Upload.id == upload_id).one()
        upload.status = UploadStatus.PROCESSING
        _update_progress(db, upload, steps, "queued")

        # ------------------------------------------------------------------
        # 1. Fetch original file from S3 to local temp using managed download
        # ------------------------------------------------------------------
        _update_progress(db, upload, steps, "fetching")
        temp_dir = tempfile.mkdtemp(prefix="upload_")
        local_path = os.path.join(temp_dir, "original")

        # Use managed download (multipart for large files)
        storage_client.download_file(upload.storage_key_original, local_path)

        file_size = os.path.getsize(local_path)
        logger.info(
            "Fetched upload %s to %s (%d bytes)",
            upload_id, local_path, file_size,
        )

        # ------------------------------------------------------------------
        # 2. Determine page count for progress reporting (PDFs only)
        # ------------------------------------------------------------------
        total_page_count = 0
        if upload.mime_type == "application/pdf":
            total_page_count = get_pdf_page_count(local_path)
            logger.info("PDF %s has %d pages", upload_id, total_page_count)

        # ------------------------------------------------------------------
        # 3. Convert & enhance pages (batched for large PDFs)
        # ------------------------------------------------------------------
        _update_progress(
            db, upload, steps, "converting",
            pages_done=0, pages_total=total_page_count,
        )

        selected = None
        if upload.progress and isinstance(upload.progress, dict):
            selected = upload.progress.get("selectedPages")

        def _page_progress(done: int, total: int):
            """Called by processor after each page is converted."""
            _update_progress(
                db, upload, steps, "enhancing",
                pages_done=done, pages_total=total,
            )

        processed = process_file(
            local_path,
            upload.mime_type,
            selected_pages=selected,
            progress_callback=_page_progress,
        )

        # ------------------------------------------------------------------
        # 4. Upload processed pages to S3 (with progress)
        # ------------------------------------------------------------------
        _update_progress(
            db, upload, steps, "uploading_pages",
            pages_done=0, pages_total=len(processed.pages),
        )

        pages = []
        for idx, page in enumerate(processed.pages, start=1):
            key_png = (
                f"projects/{upload.project_id}/uploads/{upload.id}"
                f"/pages/page_{page.page_number:02d}.png"
            )
            key_thumb = (
                f"projects/{upload.project_id}/uploads/{upload.id}"
                f"/thumbs/page_{page.page_number:02d}.jpg"
            )
            storage_client.upload_file(key_png, page.png_path, "image/png")
            storage_client.upload_file(key_thumb, page.thumb_path, "image/jpeg")

            pages.append(
                Page(
                    upload_id=upload.id,
                    page_number=page.page_number,
                    width_px=page.width_px,
                    height_px=page.height_px,
                    dpi_estimated=page.dpi_estimated,
                    storage_key_page_png=key_png,
                    storage_key_page_thumb=key_thumb,
                    status=PageStatus.READY,
                    warnings=page.warnings,
                )
            )

            _update_progress(
                db, upload, steps, "uploading_pages",
                pages_done=idx, pages_total=len(processed.pages),
            )

            # Free processed page images from disk eagerly
            try:
                os.unlink(page.png_path)
                os.unlink(page.thumb_path)
            except OSError:
                pass

        # ------------------------------------------------------------------
        # 5. Persist page records and metadata
        # ------------------------------------------------------------------
        _update_progress(db, upload, steps, "writing_db")
        for page in pages:
            db.add(page)

        upload.status = UploadStatus.READY
        upload_warnings = processed.upload_warnings or []
        upload.warnings = {
            "messages": upload_warnings,
            "totalPages": processed.total_page_count,
            "processedPages": len(pages),
            "fileSizeBytes": processed.file_size_bytes,
        }

        metadata_key = (
            f"projects/{upload.project_id}/uploads/{upload.id}"
            f"/metadata/upload.json"
        )
        metadata_payload = {
            "uploadId": str(upload.id),
            "projectId": str(upload.project_id),
            "totalPages": processed.total_page_count,
            "fileSizeBytes": processed.file_size_bytes,
            "pages": [
                {
                    "pageNumber": page.page_number,
                    "widthPx": page.width_px,
                    "heightPx": page.height_px,
                    "storageKeyPagePng": page.storage_key_page_png,
                    "storageKeyPageThumb": page.storage_key_page_thumb,
                    "warnings": page.warnings,
                }
                for page in pages
            ],
        }
        storage_client.upload_bytes(
            metadata_key,
            json.dumps(metadata_payload).encode("utf-8"),
            "application/json",
        )

        _update_progress(db, upload, steps, "done")
        logger.info(
            "Processing complete for upload %s: %d pages",
            upload_id, len(pages),
        )

    except Exception as exc:  # noqa: BLE001
        logger.exception("Processing failed for upload %s", upload_id)
        db.rollback()
        upload = db.query(Upload).filter(Upload.id == upload_id).one_or_none()
        if upload:
            upload.status = UploadStatus.FAILED
            upload.error_message = str(exc)
            db.add(upload)
            db.commit()
    finally:
        db.close()
        # Clean up all temp files
        if temp_dir and os.path.isdir(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)
        gc.collect()
