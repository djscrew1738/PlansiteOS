import json
import logging
import os
import re
import tempfile
import uuid
from fastapi import Depends, FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy import text
from sqlalchemy.orm import Session
import redis
from rq import Queue
from .config import settings
from .db import get_db
from .jobs import process_upload
from .models import Calibration, Page, Project, Upload, UploadStatus
from .rate_limit import UploadRateLimitMiddleware
from .schemas import (
    CalibrationIn,
    CalibrationOut,
    HealthOut,
    PageSelection,
    ProjectCreate,
    ProjectOut,
    UploadCreateResponse,
    UploadOut,
)
from .storage import storage_client

logger = logging.getLogger(__name__)

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/tiff",
    "image/tif",
}

# Chunk size used when streaming an incoming upload to a temp file (1 MB).
_UPLOAD_STREAM_CHUNK = 1024 * 1024

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.cors_origin],
    allow_credentials=True,
    allow_methods=["*"] ,
    allow_headers=["*"],
)
app.add_middleware(UploadRateLimitMiddleware)

redis_conn = redis.Redis.from_url(settings.redis_url)
queue = Queue("uploads", connection=redis_conn)


def _sanitize_filename(filename: str) -> str:
    name = os.path.basename(filename)
    name = re.sub(r"[^a-zA-Z0-9._-]", "_", name)
    return name[:120] if name else "upload"


@app.post("/api/projects", response_model=ProjectOut)
async def create_project(payload: ProjectCreate, db: Session = Depends(get_db)):
    project = Project(
        name=payload.name,
        address=payload.address,
        builder=payload.builder,
        foundation_type=payload.foundationType,
        floors=payload.floors,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@app.post("/api/projects/{project_id}/uploads", response_model=UploadCreateResponse)
async def upload_blueprint(project_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload a blueprint file.

    The upload body is streamed to a temporary file (never buffered in
    memory), validated, uploaded to S3, and then a background processing
    job is enqueued.  For PDFs the file is validated with poppler before
    the job is queued so the user gets immediate feedback on corrupt files.
    """
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{file.content_type}'. "
                   f"Allowed: {', '.join(sorted(ALLOWED_MIME_TYPES))}",
        )

    filename = _sanitize_filename(file.filename or "upload")
    upload_id = uuid.uuid4()
    storage_key_original = f"projects/{project_id}/uploads/{upload_id}/original/{filename}"

    # ── Stream to temp file ──────────────────────────────────────────
    total_bytes = 0
    import hashlib
    hasher = hashlib.sha256()
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(filename)[1])
    try:
        while True:
            chunk = await file.read(_UPLOAD_STREAM_CHUNK)
            if not chunk:
                break
            total_bytes += len(chunk)
            if total_bytes > settings.upload_max_bytes:
                tmp.close()
                os.unlink(tmp.name)
                raise HTTPException(
                    status_code=400,
                    detail=f"File too large. Maximum allowed size is "
                           f"{settings.upload_max_bytes // (1024 * 1024)} MB",
                )
            tmp.write(chunk)
            hasher.update(chunk)
        tmp.close()
        content_hash = hasher.hexdigest()

        logger.info(
            "Received upload %s: %d bytes, sha256=%s",
            upload_id, total_bytes, content_hash[:16],
        )

        # ── Validate PDF before uploading to S3 ─────────────────────
        pdf_page_count = None
        if file.content_type == "application/pdf":
            from .processor import validate_pdf, get_pdf_page_count
            ok, msg = validate_pdf(tmp.name)
            if not ok:
                os.unlink(tmp.name)
                raise HTTPException(status_code=422, detail=f"Invalid PDF: {msg}")
            pdf_page_count = get_pdf_page_count(tmp.name)
            if pdf_page_count > settings.pdf_max_pages:
                logger.warning(
                    "PDF %s has %d pages (max %d) — will be capped during processing",
                    upload_id, pdf_page_count, settings.pdf_max_pages,
                )

        # ── Upload to S3 ─────────────────────────────────────────────
        storage_client.upload_file(storage_key_original, tmp.name, file.content_type)

    finally:
        try:
            os.unlink(tmp.name)
        except OSError:
            pass

    # ── Create DB record ─────────────────────────────────────────────
    progress = {
        "steps": [
            "queued", "validating", "fetching",
            "processing", "uploading_pages", "writing_db", "done",
        ],
        "current": "queued",
    }
    if file.content_type == "application/pdf":
        progress["selectedPages"] = None
        if pdf_page_count:
            progress["pagesTotal"] = pdf_page_count

    upload = Upload(
        id=upload_id,
        project_id=project_id,
        original_filename=filename,
        mime_type=file.content_type,
        size_bytes=total_bytes,
        storage_key_original=storage_key_original,
        status=UploadStatus.UPLOADED,
        progress=progress,
    )
    db.add(upload)
    db.commit()

    queue.enqueue(
        process_upload,
        str(upload_id),
        job_timeout=settings.processing_timeout_seconds,
    )
    return UploadCreateResponse(uploadId=str(upload_id), status=upload.status)


@app.get("/api/uploads/{upload_id}", response_model=UploadOut)
async def get_upload(upload_id: str, db: Session = Depends(get_db)):
    upload = db.query(Upload).filter(Upload.id == upload_id).one_or_none()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")
    pages = db.query(Page).filter(Page.upload_id == upload_id).order_by(Page.page_number.asc()).all()
    upload.pages = pages
    return upload


@app.post("/api/uploads/{upload_id}/select-pages")
async def select_pages(upload_id: str, payload: PageSelection, db: Session = Depends(get_db)):
    upload = db.query(Upload).filter(Upload.id == upload_id).one_or_none()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")
    if upload.mime_type != "application/pdf":
        return {"status": "ignored"}
    progress = upload.progress or {}
    progress["selectedPages"] = payload.activePageNumbers
    upload.progress = progress
    db.add(upload)
    db.commit()
    return {"status": "saved"}


@app.get("/api/pages/{page_id}/image")
async def get_page_image(page_id: str, db: Session = Depends(get_db)):
    page = db.query(Page).filter(Page.id == page_id).one_or_none()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return StreamingResponse(storage_client.get_stream(page.storage_key_page_png), media_type="image/png")


@app.get("/api/pages/{page_id}/thumb")
async def get_page_thumb(page_id: str, db: Session = Depends(get_db)):
    page = db.query(Page).filter(Page.id == page_id).one_or_none()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return StreamingResponse(storage_client.get_stream(page.storage_key_page_thumb), media_type="image/jpeg")


@app.post("/api/pages/{page_id}/calibration", response_model=CalibrationOut)
async def set_calibration(page_id: str, payload: CalibrationIn, db: Session = Depends(get_db)):
    page = db.query(Page).filter(Page.id == page_id).one_or_none()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")

    pixels = ((payload.p2x - payload.p1x) ** 2 + (payload.p2y - payload.p1y) ** 2) ** 0.5
    pixels_per_unit = pixels / payload.realDistance

    existing = db.query(Calibration).filter(Calibration.page_id == page_id).one_or_none()
    if existing:
        existing.p1x = payload.p1x
        existing.p1y = payload.p1y
        existing.p2x = payload.p2x
        existing.p2y = payload.p2y
        existing.real_distance = payload.realDistance
        existing.real_unit = payload.realUnit
        existing.pixels_per_unit = pixels_per_unit
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return existing

    calibration = Calibration(
        page_id=page_id,
        p1x=payload.p1x,
        p1y=payload.p1y,
        p2x=payload.p2x,
        p2y=payload.p2y,
        real_distance=payload.realDistance,
        real_unit=payload.realUnit,
        pixels_per_unit=pixels_per_unit,
    )
    db.add(calibration)
    db.commit()
    db.refresh(calibration)
    return calibration


@app.get("/api/pages/{page_id}/calibration", response_model=CalibrationOut | None)
async def get_calibration(page_id: str, db: Session = Depends(get_db)):
    calibration = db.query(Calibration).filter(Calibration.page_id == page_id).one_or_none()
    return calibration


@app.get("/api/health", response_model=HealthOut)
async def healthcheck(db: Session = Depends(get_db)):
    db_ok = True
    redis_ok = True
    storage_ok = True
    try:
        db.execute(text("SELECT 1"))
    except Exception:  # noqa: BLE001
        db_ok = False
    try:
        redis_conn.ping()
    except Exception:  # noqa: BLE001
        redis_ok = False
    try:
        storage_client.client.list_objects_v2(Bucket=settings.s3_bucket, MaxKeys=1)
    except Exception:  # noqa: BLE001
        storage_ok = False

    return HealthOut(database=db_ok, redis=redis_ok, storage=storage_ok)
