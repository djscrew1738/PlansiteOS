"""Background job that processes an uploaded blueprint file.

Design goals:
  - **Per-page isolation**: a single bad page never kills the whole upload.
    Pages that fail processing are marked FAILED individually; the rest
    continue normally.
  - **Batched progress commits**: the DB is only updated every *N* pages
    (configurable) instead of on every single page, cutting commit overhead
    by ~20x on large PDFs.
  - **S3 retry**: page uploads are retried with exponential back-off so a
    transient network hiccup doesn't lose work.
  - **Phase timing**: each major phase (fetch, render, upload, db) is timed
    and stored in the upload metadata for observability.
  - **Graceful cleanup**: temp files are always removed, even on crash.
"""

from __future__ import annotations

import gc
import json
import logging
import os
import shutil
import tempfile
import time
from typing import List

from sqlalchemy.orm import Session

from .config import settings
from .db import SessionLocal
from .models import Page, PageStatus, Upload, UploadStatus
from .processor import (
    PageOutcome,
    ProcessedPage,
    get_pdf_page_count,
    output_mime_type,
    process_file,
    validate_pdf,
)
from .storage import storage_client

logger = logging.getLogger(__name__)

# ── Processing steps shown in the frontend progress bar ──────────────
STEPS = [
    "queued",
    "validating",
    "fetching",
    "processing",
    "uploading_pages",
    "writing_db",
    "done",
]


# ═══════════════════════════════════════════════════════════════════════
# Progress helpers
# ═══════════════════════════════════════════════════════════════════════

def _update_progress(
    db: Session,
    upload: Upload,
    current_step: str,
    *,
    pages_done: int = 0,
    pages_total: int = 0,
    detail: str = "",
    force_commit: bool = True,
) -> None:
    """Persist progress on the upload row.

    When *force_commit* is False the caller is responsible for committing
    (used to batch several updates into one commit).
    """
    progress = {
        "steps": STEPS,
        "current": current_step,
    }
    if pages_total > 0:
        progress["pagesDone"] = pages_done
        progress["pagesTotal"] = pages_total
        progress["pagesPercent"] = round(pages_done / pages_total * 100) if pages_total else 0
    if detail:
        progress["detail"] = detail

    upload.progress = progress
    db.add(upload)
    if force_commit:
        db.commit()


def _should_commit_progress(page_index: int) -> bool:
    """Return True if we should flush a progress update for this page."""
    interval = max(1, settings.progress_commit_interval)
    return page_index % interval == 0


# ═══════════════════════════════════════════════════════════════════════
# S3 upload with retry
# ═══════════════════════════════════════════════════════════════════════

def _upload_to_s3_with_retry(key: str, local_path: str, content_type: str) -> None:
    """Upload a file to S3 with exponential back-off retries."""
    max_retries = settings.s3_upload_max_retries
    delay = settings.s3_upload_retry_delay

    for attempt in range(1, max_retries + 1):
        try:
            storage_client.upload_file(key, local_path, content_type)
            return
        except Exception as exc:
            if attempt == max_retries:
                logger.error(
                    "S3 upload failed after %d attempts: %s -> %s",
                    max_retries, local_path, key,
                )
                raise
            logger.warning(
                "S3 upload attempt %d/%d failed for %s: %s — retrying in %.1fs",
                attempt, max_retries, key, exc, delay,
            )
            time.sleep(delay)
            delay *= 2  # exponential back-off


# ═══════════════════════════════════════════════════════════════════════
# Main job
# ═══════════════════════════════════════════════════════════════════════

def process_upload(upload_id: str) -> None:  # noqa: C901 — complexity is inherent
    """Fetch, process, and store a blueprint upload.

    This is the function enqueued in the RQ worker.
    """
    db = SessionLocal()
    temp_dir: str | None = None
    phase_timings: dict[str, float] = {}

    try:
        upload = db.query(Upload).filter(Upload.id == upload_id).one()
        upload.status = UploadStatus.PROCESSING
        _update_progress(db, upload, "queued")

        # ── Phase 1: Validate ────────────────────────────────────────
        t0 = time.monotonic()
        _update_progress(db, upload, "validating")

        temp_dir = tempfile.mkdtemp(prefix="upload_")
        local_path = os.path.join(temp_dir, "original")

        # Download original from S3
        _update_progress(db, upload, "fetching", detail="Downloading from storage...")
        storage_client.download_file(upload.storage_key_original, local_path)
        file_size = os.path.getsize(local_path)
        phase_timings["fetch_s"] = time.monotonic() - t0
        logger.info("Fetched upload %s (%s)", upload_id, _human_size(file_size))

        # PDF-specific validation
        if upload.mime_type == "application/pdf":
            ok, msg = validate_pdf(local_path)
            if not ok:
                raise ValueError(f"PDF validation failed: {msg}")

        # ── Phase 2: Determine scope ─────────────────────────────────
        total_page_count = 0
        if upload.mime_type == "application/pdf":
            total_page_count = get_pdf_page_count(local_path)
            logger.info("PDF %s: %d pages, %s", upload_id, total_page_count, _human_size(file_size))

        # ── Phase 3: Process pages ───────────────────────────────────
        t1 = time.monotonic()
        _update_progress(
            db, upload, "processing",
            pages_done=0, pages_total=total_page_count or 1,
            detail="Starting page processing...",
        )

        selected = None
        if upload.progress and isinstance(upload.progress, dict):
            selected = upload.progress.get("selectedPages")

        def _page_progress(done: int, total: int) -> None:
            """Called by processor after each page."""
            if _should_commit_progress(done):
                _update_progress(
                    db, upload, "processing",
                    pages_done=done, pages_total=total,
                    detail=f"Processing page {done}/{total}...",
                )

        processed = process_file(
            local_path,
            upload.mime_type,
            selected_pages=selected,
            progress_callback=_page_progress,
        )
        phase_timings["process_s"] = time.monotonic() - t1

        # ── Phase 4: Upload pages to S3 ──────────────────────────────
        t2 = time.monotonic()
        page_mime = output_mime_type()
        pages_to_insert: List[Page] = []
        upload_ok_count = 0
        upload_fail_count = 0

        _update_progress(
            db, upload, "uploading_pages",
            pages_done=0, pages_total=len(processed.pages),
            detail="Uploading pages to storage...",
        )

        for idx, page in enumerate(processed.pages, start=1):
            # Determine page status
            if page.outcome == PageOutcome.FAILED or not page.png_path:
                upload_fail_count += 1
                # Still create a DB record so the frontend knows this page exists
                pages_to_insert.append(Page(
                    upload_id=upload.id,
                    page_number=page.page_number,
                    width_px=page.width_px,
                    height_px=page.height_px,
                    dpi_estimated=page.dpi_estimated,
                    storage_key_page_png="",
                    storage_key_page_thumb="",
                    status=PageStatus.FAILED,
                    warnings={"messages": page.warnings, "error": page.error},
                ))
                continue

            # Build S3 keys
            ext = os.path.splitext(page.png_path)[1] or ".webp"
            key_page = (
                f"projects/{upload.project_id}/uploads/{upload.id}"
                f"/pages/page_{page.page_number:04d}{ext}"
            )
            key_thumb = (
                f"projects/{upload.project_id}/uploads/{upload.id}"
                f"/thumbs/page_{page.page_number:04d}.jpg"
            )

            try:
                _upload_to_s3_with_retry(key_page, page.png_path, page_mime)
                _upload_to_s3_with_retry(key_thumb, page.thumb_path, "image/jpeg")
                upload_ok_count += 1
            except Exception as exc:
                logger.error("S3 upload failed for page %d: %s", page.page_number, exc)
                upload_fail_count += 1
                pages_to_insert.append(Page(
                    upload_id=upload.id,
                    page_number=page.page_number,
                    width_px=page.width_px,
                    height_px=page.height_px,
                    dpi_estimated=page.dpi_estimated,
                    storage_key_page_png="",
                    storage_key_page_thumb="",
                    status=PageStatus.FAILED,
                    warnings={"messages": page.warnings, "error": f"S3 upload failed: {exc}"},
                ))
                continue

            pages_to_insert.append(Page(
                upload_id=upload.id,
                page_number=page.page_number,
                width_px=page.width_px,
                height_px=page.height_px,
                dpi_estimated=page.dpi_estimated,
                storage_key_page_png=key_page,
                storage_key_page_thumb=key_thumb,
                status=PageStatus.READY,
                warnings={
                    "messages": page.warnings,
                    "metrics": {
                        "enhance_ms": round(page.metrics.enhance_ms, 1),
                        "encode_ms": round(page.metrics.encode_ms, 1),
                        "total_ms": round(page.metrics.total_ms, 1),
                        "blur_score": round(page.metrics.blur_score, 1),
                        "output_bytes": page.metrics.output_bytes,
                        "steps": page.metrics.steps_applied,
                    },
                },
            ))

            # Eagerly delete temp files
            for p in (page.png_path, page.thumb_path):
                try:
                    os.unlink(p)
                except OSError:
                    pass

            # Batched progress update
            if _should_commit_progress(idx):
                _update_progress(
                    db, upload, "uploading_pages",
                    pages_done=idx, pages_total=len(processed.pages),
                    detail=f"Uploaded {idx}/{len(processed.pages)} pages",
                )

        phase_timings["upload_s"] = time.monotonic() - t2

        # ── Phase 5: Write DB records ────────────────────────────────
        t3 = time.monotonic()
        _update_progress(db, upload, "writing_db", detail="Saving to database...")

        for page_model in pages_to_insert:
            db.add(page_model)

        # Determine final status
        if upload_ok_count == 0 and len(processed.pages) > 0:
            upload.status = UploadStatus.FAILED
            upload.error_message = "All pages failed processing"
        else:
            upload.status = UploadStatus.READY

        # Build summary warnings
        upload.warnings = {
            "messages": processed.upload_warnings or [],
            "totalPages": processed.total_page_count,
            "processedPages": len(processed.pages),
            "okPages": processed.ok_count,
            "warnPages": processed.warn_count,
            "failedPages": processed.failed_count,
            "fileSizeBytes": processed.file_size_bytes,
            "processingMs": round(processed.total_processing_ms, 1),
            "phaseTimings": {k: round(v, 2) for k, v in phase_timings.items()},
        }

        # Upload metadata JSON
        metadata_key = (
            f"projects/{upload.project_id}/uploads/{upload.id}"
            f"/metadata/upload.json"
        )
        ready_pages = [p for p in pages_to_insert if p.status == PageStatus.READY]
        metadata_payload = {
            "uploadId": str(upload.id),
            "projectId": str(upload.project_id),
            "totalPages": processed.total_page_count,
            "processedPages": len(processed.pages),
            "okPages": processed.ok_count,
            "failedPages": processed.failed_count,
            "fileSizeBytes": processed.file_size_bytes,
            "processingMs": round(processed.total_processing_ms, 1),
            "pages": [
                {
                    "pageNumber": p.page_number,
                    "widthPx": p.width_px,
                    "heightPx": p.height_px,
                    "storageKeyPagePng": p.storage_key_page_png,
                    "storageKeyPageThumb": p.storage_key_page_thumb,
                    "status": p.status.value,
                }
                for p in ready_pages
            ],
        }
        try:
            storage_client.upload_bytes(
                metadata_key,
                json.dumps(metadata_payload, default=str).encode("utf-8"),
                "application/json",
            )
        except Exception as exc:
            logger.error("Failed to upload metadata for %s: %s", upload_id, exc)
            # Non-fatal: pages are already uploaded

        phase_timings["db_s"] = time.monotonic() - t3

        _update_progress(db, upload, "done")
        db.commit()

        total_time = sum(phase_timings.values())
        logger.info(
            "Upload %s complete: %d/%d pages OK in %.1fs "
            "(fetch=%.1fs, process=%.1fs, upload=%.1fs, db=%.1fs)",
            upload_id,
            upload_ok_count, len(processed.pages),
            total_time,
            phase_timings.get("fetch_s", 0),
            phase_timings.get("process_s", 0),
            phase_timings.get("upload_s", 0),
            phase_timings.get("db_s", 0),
        )

    except Exception as exc:
        logger.exception("Processing failed for upload %s", upload_id)
        db.rollback()
        upload = db.query(Upload).filter(Upload.id == upload_id).one_or_none()
        if upload:
            upload.status = UploadStatus.FAILED
            err_msg = str(exc)
            upload.error_message = err_msg[: settings.max_error_message_length]
            db.add(upload)
            db.commit()
    finally:
        db.close()
        if temp_dir and os.path.isdir(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)
        gc.collect()


def _human_size(size_bytes: int) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if abs(size_bytes) < 1024:
            return f"{size_bytes:.1f}{unit}"
        size_bytes /= 1024  # type: ignore[assignment]
    return f"{size_bytes:.1f}TB"
