"""Pages API router."""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Page, Calibration
from app.schemas import SignedUrlResponse, CalibrationCreate, CalibrationResponse
from app.dependencies import get_page
from app.storage import storage_client
from app.config import settings
from datetime import datetime, timedelta
import math

router = APIRouter(prefix="/pages", tags=["pages"])


@router.get("/{page_id}/image")
def get_page_image(
    page_id: str,
    page: Page = Depends(get_page),
    use_proxy: bool = True,
):
    """Get page image (PNG).

    Args:
        page_id: Page UUID
        page: Page instance
        use_proxy: If True, proxy the image; if False, return signed URL

    Returns:
        Image bytes (proxy mode) or signed URL JSON
    """
    if use_proxy:
        # Proxy mode: download and return image
        image_data = storage_client.download_file(page.storage_key_page_png)
        if not image_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Image file not found in storage"
            )
        return Response(content=image_data, media_type="image/png")
    else:
        # Signed URL mode
        signed_url = storage_client.get_signed_url(
            page.storage_key_page_png,
            expires=settings.signed_url_expiry
        )
        if not signed_url:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate signed URL"
            )
        return SignedUrlResponse(
            url=signed_url,
            expires_at=datetime.utcnow() + timedelta(seconds=settings.signed_url_expiry)
        )


@router.get("/{page_id}/thumb")
def get_page_thumbnail(
    page_id: str,
    page: Page = Depends(get_page),
    use_proxy: bool = True,
):
    """Get page thumbnail (JPEG).

    Args:
        page_id: Page UUID
        page: Page instance
        use_proxy: If True, proxy the image; if False, return signed URL

    Returns:
        Image bytes (proxy mode) or signed URL JSON
    """
    if not page.storage_key_page_thumb:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thumbnail not available"
        )

    if use_proxy:
        # Proxy mode: download and return image
        thumb_data = storage_client.download_file(page.storage_key_page_thumb)
        if not thumb_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Thumbnail file not found in storage"
            )
        return Response(content=thumb_data, media_type="image/jpeg")
    else:
        # Signed URL mode
        signed_url = storage_client.get_signed_url(
            page.storage_key_page_thumb,
            expires=settings.signed_url_expiry
        )
        if not signed_url:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate signed URL"
            )
        return SignedUrlResponse(
            url=signed_url,
            expires_at=datetime.utcnow() + timedelta(seconds=settings.signed_url_expiry)
        )


@router.post("/{page_id}/calibration", response_model=CalibrationResponse, status_code=status.HTTP_201_CREATED)
def create_calibration(
    page_id: str,
    calibration_data: CalibrationCreate,
    page: Page = Depends(get_page),
    db: Session = Depends(get_db)
):
    """Create or update calibration for a page.

    Args:
        page_id: Page UUID
        calibration_data: Calibration data
        page: Page instance
        db: Database session

    Returns:
        Created/updated calibration
    """
    # Calculate pixels per unit
    dx = calibration_data.p2x - calibration_data.p1x
    dy = calibration_data.p2y - calibration_data.p1y
    pixel_distance = math.sqrt(dx * dx + dy * dy)
    pixels_per_unit = pixel_distance / calibration_data.real_distance

    # Check if calibration exists
    existing = db.query(Calibration).filter(Calibration.page_id == page.id).first()

    if existing:
        # Update existing
        existing.p1x = calibration_data.p1x
        existing.p1y = calibration_data.p1y
        existing.p2x = calibration_data.p2x
        existing.p2y = calibration_data.p2y
        existing.real_distance = calibration_data.real_distance
        existing.real_unit = calibration_data.real_unit
        existing.pixels_per_unit = pixels_per_unit
        calibration = existing
    else:
        # Create new
        calibration = Calibration(
            page_id=page.id,
            p1x=calibration_data.p1x,
            p1y=calibration_data.p1y,
            p2x=calibration_data.p2x,
            p2y=calibration_data.p2y,
            real_distance=calibration_data.real_distance,
            real_unit=calibration_data.real_unit,
            pixels_per_unit=pixels_per_unit,
        )
        db.add(calibration)

    db.commit()
    db.refresh(calibration)
    return calibration


@router.get("/{page_id}/calibration", response_model=CalibrationResponse | None)
def get_calibration(
    page_id: str,
    page: Page = Depends(get_page),
    db: Session = Depends(get_db)
):
    """Get calibration for a page.

    Args:
        page_id: Page UUID
        page: Page instance
        db: Database session

    Returns:
        Calibration or None if not calibrated
    """
    calibration = db.query(Calibration).filter(Calibration.page_id == page.id).first()
    return calibration
