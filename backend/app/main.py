import os
import re
import uuid
from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import redis
from rq import Queue
from .config import settings
from .db import get_db
from .jobs import process_upload
from .models import (
    Calibration,
    Page,
    Project,
    Upload,
    UploadStatus,
    Pipeline,
    Node,
    Segment,
    PricingItem,
    PricingHistory,
    QuickBooksIntegration,
)
from .rate_limit import UploadRateLimitMiddleware
from .schemas import (
    CalibrationIn,
    CalibrationOut,
    HealthOut,
    PageUpdate,
    PageSelection,
    PipelineCreate,
    PipelineOut,
    NodeCreate,
    NodeOut,
    SegmentCreate,
    SegmentOut,
    PricingItemCreate,
    PricingItemOut,
    PricingHistoryCreate,
    PricingHistoryOut,
    QuickBooksConfigCreate,
    QuickBooksConfigOut,
    ProjectCreate,
    ProjectOut,
    UploadCreateResponse,
    UploadOut,
)
from .storage import storage_client
from .vision_stack import get_vision_stack

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
}

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.cors_origin],
    allow_credentials=True,
    allow_methods=["*"],
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
async def upload_blueprint(
    project_id: str,
    file: UploadFile = File(...),
    revisionLabel: str | None = Form(default=None),
    db: Session = Depends(get_db),
):
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    contents = await file.read()
    if len(contents) > settings.upload_max_bytes:
        raise HTTPException(status_code=400, detail="File too large")

    filename = _sanitize_filename(file.filename or "upload")
    upload_id = uuid.uuid4()
    storage_key_original = f"projects/{project_id}/uploads/{upload_id}/original/{filename}"

    storage_client.upload_bytes(storage_key_original, contents, file.content_type)

    progress = {"steps": ["queued"], "current": "queued"}
    if file.content_type == "application/pdf":
        progress["selectedPages"] = [1]

    upload = Upload(
        id=upload_id,
        project_id=project_id,
        original_filename=filename,
        mime_type=file.content_type,
        size_bytes=len(contents),
        storage_key_original=storage_key_original,
        status=UploadStatus.UPLOADED,
        progress=progress,
        revision_label=revisionLabel,
    )
    db.add(upload)
    db.commit()

    queue.enqueue(process_upload, str(upload_id))
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
    if payload.labels:
        progress["pageLabels"] = payload.labels
    if payload.revisionLabel:
        upload.revision_label = payload.revisionLabel
    upload.progress = progress
    db.add(upload)
    db.commit()
    return {"status": "saved"}


@app.patch("/api/pages/{page_id}")
async def update_page(page_id: str, payload: PageUpdate, db: Session = Depends(get_db)):
    page = db.query(Page).filter(Page.id == page_id).one_or_none()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    if payload.label is not None:
        page.label = payload.label
    if payload.isSelected is not None:
        page.is_selected = payload.isSelected
    db.add(page)
    db.commit()
    db.refresh(page)
    return page


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
        db.execute("SELECT 1")
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


@app.get("/api/vision-stack")
async def vision_stack():
    return [tool.__dict__ for tool in get_vision_stack()]


@app.post("/api/pipelines", response_model=PipelineOut)
async def create_pipeline(payload: PipelineCreate, db: Session = Depends(get_db)):
    pipeline = Pipeline(
        project_id=payload.projectId,
        page_id=payload.pageId,
        system_type=payload.systemType,
        name=payload.name,
        phase=payload.phase,
    )
    db.add(pipeline)
    db.commit()
    db.refresh(pipeline)
    return pipeline


@app.get("/api/pages/{page_id}/pipelines", response_model=list[PipelineOut])
async def list_pipelines(page_id: str, db: Session = Depends(get_db)):
    return db.query(Pipeline).filter(Pipeline.page_id == page_id).all()


@app.post("/api/nodes", response_model=NodeOut)
async def create_node(payload: NodeCreate, db: Session = Depends(get_db)):
    node = Node(
        pipeline_id=payload.pipelineId,
        node_type=payload.nodeType,
        x=payload.x,
        y=payload.y,
        metadata=payload.metadata,
    )
    db.add(node)
    db.commit()
    db.refresh(node)
    return node


@app.get("/api/pipelines/{pipeline_id}/nodes", response_model=list[NodeOut])
async def list_nodes(pipeline_id: str, db: Session = Depends(get_db)):
    return db.query(Node).filter(Node.pipeline_id == pipeline_id).all()


@app.post("/api/segments", response_model=SegmentOut)
async def create_segment(payload: SegmentCreate, db: Session = Depends(get_db)):
    segment = Segment(
        pipeline_id=payload.pipelineId,
        points=payload.points,
        diameter=payload.diameter,
        material=payload.material,
        slope=payload.slope,
        depth=payload.depth,
        phase=payload.phase,
        tags=payload.tags,
    )
    db.add(segment)
    db.commit()
    db.refresh(segment)
    return segment


@app.get("/api/pipelines/{pipeline_id}/segments", response_model=list[SegmentOut])
async def list_segments(pipeline_id: str, db: Session = Depends(get_db)):
    return db.query(Segment).filter(Segment.pipeline_id == pipeline_id).all()


@app.delete("/api/segments/{segment_id}")
async def delete_segment(segment_id: str, db: Session = Depends(get_db)):
    segment = db.query(Segment).filter(Segment.id == segment_id).one_or_none()
    if not segment:
        raise HTTPException(status_code=404, detail="Segment not found")
    db.delete(segment)
    db.commit()
    return {"status": "deleted"}


@app.delete("/api/pipelines/{pipeline_id}")
async def delete_pipeline(pipeline_id: str, db: Session = Depends(get_db)):
    pipeline = db.query(Pipeline).filter(Pipeline.id == pipeline_id).one_or_none()
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    db.query(Segment).filter(Segment.pipeline_id == pipeline_id).delete()
    db.query(Node).filter(Node.pipeline_id == pipeline_id).delete()
    db.delete(pipeline)
    db.commit()
    return {"status": "deleted"}


@app.post("/api/pricing/items", response_model=PricingItemOut)
async def create_pricing_item(payload: PricingItemCreate, db: Session = Depends(get_db)):
    item = PricingItem(project_id=payload.projectId, name=payload.name, unit=payload.unit)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@app.get("/api/pricing/items/{project_id}", response_model=list[PricingItemOut])
async def list_pricing_items(project_id: str, db: Session = Depends(get_db)):
    return db.query(PricingItem).filter(PricingItem.project_id == project_id).all()


@app.post("/api/pricing/history", response_model=PricingHistoryOut)
async def add_pricing_history(payload: PricingHistoryCreate, db: Session = Depends(get_db)):
    history = PricingHistory(item_id=payload.itemId, price=payload.price, source=payload.source)
    db.add(history)
    db.commit()
    db.refresh(history)
    return history


@app.get("/api/pricing/history/{item_id}", response_model=list[PricingHistoryOut])
async def list_pricing_history(item_id: str, db: Session = Depends(get_db)):
    return db.query(PricingHistory).filter(PricingHistory.item_id == item_id).all()


@app.post("/api/integrations/quickbooks", response_model=QuickBooksConfigOut)
async def set_quickbooks_config(payload: QuickBooksConfigCreate, db: Session = Depends(get_db)):
    integration = QuickBooksIntegration(
        project_id=payload.projectId,
        company_id=payload.companyId,
        access_token=payload.accessToken,
        refresh_token=payload.refreshToken,
        status=payload.status,
    )
    db.add(integration)
    db.commit()
    db.refresh(integration)
    return integration


@app.get("/api/integrations/quickbooks/{project_id}", response_model=QuickBooksConfigOut | None)
async def get_quickbooks_config(project_id: str, db: Session = Depends(get_db)):
    return db.query(QuickBooksIntegration).filter(QuickBooksIntegration.project_id == project_id).one_or_none()
