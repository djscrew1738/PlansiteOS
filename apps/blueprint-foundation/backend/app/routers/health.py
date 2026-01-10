"""Health check API router."""
from fastapi import APIRouter
from app.schemas import HealthResponse
from app.database import engine
from app.storage import storage_client
from redis import Redis
from app.config import settings

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health_check():
    """Health check endpoint.

    Returns:
        Health status of all dependencies
    """
    # Check database
    db_status = "ok"
    try:
        with engine.connect() as conn:
            conn.execute("SELECT 1")
    except Exception as e:
        db_status = f"error: {str(e)}"

    # Check Redis
    redis_status = "ok"
    try:
        redis_conn = Redis.from_url(settings.redis_url)
        redis_conn.ping()
    except Exception as e:
        redis_status = f"error: {str(e)}"

    # Check object storage
    storage_status = "ok"
    try:
        storage_client.client.bucket_exists(storage_client.bucket)
    except Exception as e:
        storage_status = f"error: {str(e)}"

    # Overall status
    overall_status = "ok" if all(
        s == "ok" for s in [db_status, redis_status, storage_status]
    ) else "degraded"

    return HealthResponse(
        status=overall_status,
        database=db_status,
        redis=redis_status,
        storage=storage_status,
    )
