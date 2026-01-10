import json
import os
import tempfile
from sqlalchemy.orm import Session
from .db import SessionLocal
from .models import Upload, UploadStatus, Page, PageStatus
from .processor import process_file
from .storage import storage_client


def _update_progress(db: Session, upload: Upload, status_list, current_step):
    progress = upload.progress or {}
    progress["steps"] = status_list
    progress["current"] = current_step
    upload.progress = progress
    db.add(upload)
    db.commit()


def process_upload(upload_id: str):
    steps = ["queued", "fetching", "converting", "enhancing", "uploading_pages", "writing_db", "done"]
    db = SessionLocal()
    try:
        upload = db.query(Upload).filter(Upload.id == upload_id).one()
        upload.status = UploadStatus.PROCESSING
        _update_progress(db, upload, steps, "queued")

        _update_progress(db, upload, steps, "fetching")
        temp_dir = tempfile.mkdtemp(prefix="upload_")
        local_path = os.path.join(temp_dir, "original")
        with open(local_path, "wb") as handle:
            for chunk in storage_client.get_stream(upload.storage_key_original):
                handle.write(chunk)

        _update_progress(db, upload, steps, "converting")
        selected = None
        label_map = {}
        if upload.progress and isinstance(upload.progress, dict):
            selected = upload.progress.get("selectedPages")
            label_map = upload.progress.get("pageLabels") or {}
        processed = process_file(local_path, upload.mime_type, selected_pages=selected)

        _update_progress(db, upload, steps, "enhancing")

        _update_progress(db, upload, steps, "uploading_pages")
        pages = []
        for page in processed.pages:
            key_png = f"projects/{upload.project_id}/uploads/{upload.id}/pages/page_{page.page_number:02d}.png"
            key_thumb = f"projects/{upload.project_id}/uploads/{upload.id}/thumbs/page_{page.page_number:02d}.jpg"
            storage_client.upload_file(key_png, page.png_path, "image/png")
            storage_client.upload_file(key_thumb, page.thumb_path, "image/jpeg")
            is_selected = True if not selected else page.page_number in selected
            label_value = label_map.get(str(page.page_number)) or label_map.get(page.page_number) or "OTHER"
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
                    label=label_value,
                    is_selected=is_selected,
                    warnings=page.warnings,
                )
            )

        _update_progress(db, upload, steps, "writing_db")
        for page in pages:
            db.add(page)
        upload.status = UploadStatus.READY
        upload.warnings = processed.upload_warnings
        metadata_key = f"projects/{upload.project_id}/uploads/{upload.id}/metadata/upload.json"
        metadata_payload = {
            "uploadId": str(upload.id),
            "projectId": str(upload.project_id),
            "revisionLabel": upload.revision_label,
            "pages": [
                {
                    "pageNumber": page.page_number,
                    "widthPx": page.width_px,
                    "heightPx": page.height_px,
                    "storageKeyPagePng": page.storage_key_page_png,
                    "storageKeyPageThumb": page.storage_key_page_thumb,
                    "label": page.label,
                    "isSelected": page.is_selected,
                    "warnings": page.warnings,
                }
                for page in pages
            ],
        }
        storage_client.upload_bytes(metadata_key, json.dumps(metadata_payload).encode("utf-8"), "application/json")
        _update_progress(db, upload, steps, "done")
    except Exception as exc:  # noqa: BLE001
        db.rollback()
        upload = db.query(Upload).filter(Upload.id == upload_id).one_or_none()
        if upload:
            upload.status = UploadStatus.FAILED
            upload.error_message = str(exc)
            db.add(upload)
            db.commit()
    finally:
        db.close()
