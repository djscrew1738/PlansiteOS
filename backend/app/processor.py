import gc
import io
import logging
import math
import os
import tempfile
from dataclasses import dataclass, field
from typing import Callable, Dict, Generator, List, Optional, Tuple

import cv2
import numpy as np
from pdf2image import convert_from_path, pdfinfo_from_path
from PIL import Image

from .config import settings

logger = logging.getLogger(__name__)


@dataclass
class ProcessedPage:
    page_number: int
    width_px: int
    height_px: int
    dpi_estimated: Optional[int]
    warnings: List[str]
    png_path: str
    thumb_path: str


@dataclass
class ProcessedUpload:
    upload_warnings: List[str]
    pages: List[ProcessedPage]
    total_page_count: int = 0
    file_size_bytes: int = 0


BLUR_THRESHOLD = 120.0
MIN_SHORT_SIDE = 1800


# ---------------------------------------------------------------------------
# Image enhancement helpers (unchanged logic, wrapped for clarity)
# ---------------------------------------------------------------------------


def _deskew(image: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray = cv2.bitwise_not(gray)
    thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)[1]
    coords = np.column_stack(np.where(thresh > 0))
    if coords.size == 0:
        return image
    angle = cv2.minAreaRect(coords)[-1]
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle
    (h, w) = image.shape[:2]
    center = (w // 2, h // 2)
    m = cv2.getRotationMatrix2D(center, angle, 1.0)
    rotated = cv2.warpAffine(image, m, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    return rotated


def _auto_rotate(image: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150)
    coords = np.column_stack(np.where(edges > 0))
    if coords.size == 0:
        return image
    angle = cv2.minAreaRect(coords)[-1]
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle
    snapped = round(angle / 90) * 90
    if snapped % 360 == 0:
        return image
    if snapped % 360 == 90:
        return cv2.rotate(image, cv2.ROTATE_90_CLOCKWISE)
    if snapped % 360 == 180:
        return cv2.rotate(image, cv2.ROTATE_180)
    if snapped % 360 == 270:
        return cv2.rotate(image, cv2.ROTATE_90_COUNTERCLOCKWISE)
    return image


def _clahe(image: np.ndarray) -> np.ndarray:
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    cl = clahe.apply(l)
    limg = cv2.merge((cl, a, b))
    return cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)


def _blur_score(image: np.ndarray) -> float:
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    return cv2.Laplacian(gray, cv2.CV_64F).var()


def _estimate_dpi(image: Image.Image) -> Optional[int]:
    dpi = image.info.get("dpi")
    if dpi:
        return int(dpi[0])
    return None


def _save_thumbnail(image: Image.Image, path: str) -> None:
    thumb = image.copy()
    thumb.thumbnail((512, 512))
    thumb.save(path, format="JPEG", quality=85)


# ---------------------------------------------------------------------------
# PDF info helper
# ---------------------------------------------------------------------------


def get_pdf_page_count(file_path: str) -> int:
    """Return the number of pages in a PDF without rendering any pages."""
    try:
        info = pdfinfo_from_path(file_path)
        return int(info.get("Pages", 0))
    except Exception:
        logger.warning("Could not determine PDF page count for %s", file_path)
        return 0


def _select_render_dpi(total_pages: int) -> int:
    """Choose DPI based on page count to balance quality and memory usage.

    Large documents (>threshold pages) render at a lower DPI to avoid
    excessive memory consumption."""
    if total_pages > settings.pdf_large_page_threshold:
        return settings.pdf_large_render_dpi
    return settings.pdf_render_dpi


# ---------------------------------------------------------------------------
# Batch page iterator – converts *batch_size* pages at a time to keep
# peak memory bounded.
# ---------------------------------------------------------------------------


def _iter_pdf_pages_batched(
    file_path: str,
    dpi: int,
    batch_size: int,
    total_pages: int,
    selected_pages: Optional[List[int]] = None,
) -> Generator[Tuple[int, Image.Image], None, None]:
    """Yield ``(page_number, pil_image)`` tuples by converting the PDF in
    batches of *batch_size* pages at a time.  Each batch is converted then
    yielded so that the caller can process and discard images before the next
    batch is loaded.  This drastically reduces peak memory for large PDFs."""
    for batch_start in range(1, total_pages + 1, batch_size):
        batch_end = min(batch_start + batch_size - 1, total_pages)

        # Determine which pages in this batch we actually need
        if selected_pages:
            needed = [p for p in range(batch_start, batch_end + 1) if p in selected_pages]
            if not needed:
                continue
        else:
            needed = list(range(batch_start, batch_end + 1))

        logger.debug(
            "Rendering PDF pages %d-%d (batch), dpi=%d",
            batch_start, batch_end, dpi,
        )
        batch_images = convert_from_path(
            file_path,
            dpi=dpi,
            first_page=batch_start,
            last_page=batch_end,
        )

        for offset, pil_image in enumerate(batch_images):
            page_num = batch_start + offset
            if selected_pages and page_num not in selected_pages:
                continue
            yield page_num, pil_image

        # Explicitly release batch memory
        del batch_images
        gc.collect()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def process_file(
    file_path: str,
    mime_type: str,
    selected_pages: Optional[List[int]] = None,
    progress_callback: Optional[Callable[[int, int], None]] = None,
) -> ProcessedUpload:
    """Process an uploaded file (image or PDF) and return page-level results.

    For PDFs, pages are rendered in configurable batches to keep memory
    usage bounded even for very large documents.

    Parameters
    ----------
    file_path:
        Local path to the source file.
    mime_type:
        MIME type of the file.
    selected_pages:
        Optional list of 1-based page numbers to process.  ``None`` means
        process every page.
    progress_callback:
        Optional ``(current_page, total_pages) -> None`` callable invoked
        after each page is processed.
    """
    upload_warnings: List[str] = []
    pages: List[ProcessedPage] = []
    temp_dir = tempfile.mkdtemp(prefix="processed_")
    total_page_count = 0

    file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0

    if mime_type == "application/pdf":
        total_page_count = get_pdf_page_count(file_path)

        if total_page_count == 0:
            upload_warnings.append("Could not determine PDF page count")
            # Fall back to old single-batch behaviour
            total_page_count = 1

        if total_page_count > settings.pdf_max_pages:
            upload_warnings.append(
                f"PDF has {total_page_count} pages; only the first "
                f"{settings.pdf_max_pages} will be processed"
            )
            effective_total = settings.pdf_max_pages
        else:
            effective_total = total_page_count

        dpi = _select_render_dpi(effective_total)
        batch_size = settings.pdf_page_batch_size

        if dpi < settings.pdf_render_dpi:
            upload_warnings.append(
                f"Large PDF detected ({total_page_count} pages); "
                f"rendering at {dpi} DPI instead of {settings.pdf_render_dpi} DPI "
                "to optimize memory usage"
            )

        logger.info(
            "Processing PDF: %d total pages, effective=%d, dpi=%d, batch=%d, file_size=%d",
            total_page_count, effective_total, dpi, batch_size, file_size,
        )

        # Restrict selected_pages to the effective range
        if selected_pages:
            selected_pages = [p for p in selected_pages if p <= effective_total]

        processed_count = 0
        for page_num, pil_image in _iter_pdf_pages_batched(
            file_path, dpi, batch_size, effective_total, selected_pages
        ):
            pages.append(_process_page(pil_image, page_num, temp_dir))
            processed_count += 1

            if progress_callback:
                total_to_process = len(selected_pages) if selected_pages else effective_total
                progress_callback(processed_count, total_to_process)

            # Release the PIL image right away
            del pil_image
            gc.collect()
    else:
        total_page_count = 1
        pil_image = Image.open(file_path).convert("RGB")
        pages.append(_process_page(pil_image, 1, temp_dir))
        if progress_callback:
            progress_callback(1, 1)

    if not pages:
        upload_warnings.append("No pages processed")

    return ProcessedUpload(
        upload_warnings=upload_warnings,
        pages=pages,
        total_page_count=total_page_count,
        file_size_bytes=file_size,
    )


def _process_page(pil_image: Image.Image, page_number: int, temp_dir: str) -> ProcessedPage:
    warnings: List[str] = []
    np_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
    np_image = _deskew(np_image)
    np_image = _auto_rotate(np_image)
    np_image = _clahe(np_image)

    height, width = np_image.shape[:2]
    blur = _blur_score(np_image)
    if blur < BLUR_THRESHOLD:
        warnings.append("blur_detected")
    if min(height, width) < MIN_SHORT_SIDE:
        warnings.append("low_resolution")

    png_path = f"{temp_dir}/page_{page_number:02d}.png"
    thumb_path = f"{temp_dir}/page_{page_number:02d}.jpg"
    cv2.imwrite(png_path, np_image)
    pil_out = Image.fromarray(cv2.cvtColor(np_image, cv2.COLOR_BGR2RGB))
    _save_thumbnail(pil_out, thumb_path)

    return ProcessedPage(
        page_number=page_number,
        width_px=width,
        height_px=height,
        dpi_estimated=_estimate_dpi(pil_image),
        warnings=warnings,
        png_path=png_path,
        thumb_path=thumb_path,
    )
