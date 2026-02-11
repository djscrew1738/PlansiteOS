"""Blueprint PDF / image processor.

Production-grade processing pipeline for construction blueprint files.
Key design goals:
  - Bounded memory: pages rendered in configurable batches; oversized pages
    force-downscaled before enhancement.
  - Per-page isolation: a single corrupt/slow page never kills the whole upload.
  - Adaptive pipeline: analysis (deskew/rotate detection) runs on a
    quarter-resolution copy; enhancement steps are skipped when the image
    already meets quality thresholds.
  - Observable: per-page timing metrics, structured warnings, progress callbacks.
"""

from __future__ import annotations

import gc
import logging
import os
import signal
import tempfile
import time
from contextlib import contextmanager
from dataclasses import dataclass, field
from enum import Enum
from typing import Callable, Generator, List, Optional, Tuple

import cv2
import numpy as np
from pdf2image import convert_from_path, pdfinfo_from_path
from PIL import Image

from .config import settings

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════════
# Data classes
# ═══════════════════════════════════════════════════════════════════════

class PageOutcome(str, Enum):
    OK = "ok"
    WARN = "warn"
    FAILED = "failed"


@dataclass
class PageMetrics:
    render_ms: float = 0.0
    enhance_ms: float = 0.0
    encode_ms: float = 0.0
    total_ms: float = 0.0
    blur_score: float = 0.0
    contrast_score: float = 0.0
    skew_angle: float = 0.0
    input_pixels: int = 0
    output_pixels: int = 0
    output_bytes: int = 0
    thumb_bytes: int = 0
    steps_applied: List[str] = field(default_factory=list)


@dataclass
class ProcessedPage:
    page_number: int
    width_px: int
    height_px: int
    dpi_estimated: Optional[int]
    warnings: List[str]
    png_path: str          # main output (may be .webp despite the field name)
    thumb_path: str
    outcome: PageOutcome = PageOutcome.OK
    error: Optional[str] = None
    metrics: PageMetrics = field(default_factory=PageMetrics)


@dataclass
class ProcessedUpload:
    upload_warnings: List[str]
    pages: List[ProcessedPage]
    total_page_count: int = 0
    file_size_bytes: int = 0
    ok_count: int = 0
    warn_count: int = 0
    failed_count: int = 0
    total_processing_ms: float = 0.0


# ═══════════════════════════════════════════════════════════════════════
# Helpers
# ═══════════════════════════════════════════════════════════════════════

@contextmanager
def _timer():
    """Lightweight wall-clock timer context manager."""
    start = time.monotonic()
    result = {"ms": 0.0}
    try:
        yield result
    finally:
        result["ms"] = (time.monotonic() - start) * 1000.0


def _downscale_for_analysis(image: np.ndarray, factor: int) -> np.ndarray:
    """Return a copy of *image* downscaled by *factor* using INTER_AREA."""
    if factor <= 1:
        return image
    h, w = image.shape[:2]
    return cv2.resize(image, (max(1, w // factor), max(1, h // factor)),
                      interpolation=cv2.INTER_AREA)


def _clamp_page_size(pil_image: Image.Image) -> Tuple[Image.Image, bool]:
    """If the pixel area exceeds *max_page_pixels*, downscale proportionally.

    Returns (image, was_downscaled).
    """
    w, h = pil_image.size
    area = w * h
    max_px = settings.max_page_pixels
    if area <= max_px:
        return pil_image, False
    scale = (max_px / area) ** 0.5
    new_w, new_h = max(1, int(w * scale)), max(1, int(h * scale))
    logger.warning(
        "Page too large (%dx%d = %dMpx); downscaling to %dx%d",
        w, h, area // 1_000_000, new_w, new_h,
    )
    return pil_image.resize((new_w, new_h), Image.LANCZOS), True


# ═══════════════════════════════════════════════════════════════════════
# Enhancement steps
# ═══════════════════════════════════════════════════════════════════════

def _detect_skew_angle(image: np.ndarray) -> float:
    """Detect skew angle using the minimum-area bounding rectangle on
    thresholded text regions.  Runs on a downscaled copy for speed."""
    small = _downscale_for_analysis(image, settings.analysis_downscale)
    gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
    gray = cv2.bitwise_not(gray)
    thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)[1]
    coords = np.column_stack(np.where(thresh > 0))
    if coords.size < 100:
        return 0.0
    angle = cv2.minAreaRect(coords)[-1]
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle
    return angle


def _apply_deskew(image: np.ndarray, angle: float) -> np.ndarray:
    """Rotate *image* by *angle* degrees with border replication."""
    if abs(angle) < 0.1:
        return image
    clamped = max(-settings.deskew_max_angle, min(settings.deskew_max_angle, angle))
    if abs(clamped) < 0.1:
        return image
    h, w = image.shape[:2]
    center = (w // 2, h // 2)
    m = cv2.getRotationMatrix2D(center, clamped, 1.0)
    return cv2.warpAffine(
        image, m, (w, h),
        flags=cv2.INTER_LINEAR,
        borderMode=cv2.BORDER_REPLICATE,
    )


def _detect_cardinal_rotation(image: np.ndarray) -> int:
    """Detect if the image needs a 90/180/270 degree rotation.

    Returns the rotation in degrees (0, 90, 180, or 270).
    Uses edge detection on a downscaled copy.
    """
    small = _downscale_for_analysis(image, settings.analysis_downscale)
    gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150)
    coords = np.column_stack(np.where(edges > 0))
    if coords.size < 50:
        return 0
    angle = cv2.minAreaRect(coords)[-1]
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle
    snapped = round(angle / 90) * 90
    return snapped % 360


def _apply_cardinal_rotation(image: np.ndarray, degrees: int) -> np.ndarray:
    """Apply a 90/180/270 rotation."""
    if degrees == 90:
        return cv2.rotate(image, cv2.ROTATE_90_CLOCKWISE)
    if degrees == 180:
        return cv2.rotate(image, cv2.ROTATE_180)
    if degrees == 270:
        return cv2.rotate(image, cv2.ROTATE_90_COUNTERCLOCKWISE)
    return image


def _contrast_score(image: np.ndarray) -> float:
    """Return a contrast metric (std-dev of luminance).  Higher = more contrast."""
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image
    # Use a downscaled version for speed
    small = cv2.resize(gray, (256, 256), interpolation=cv2.INTER_AREA) if gray.size > 256 * 256 else gray
    return float(np.std(small))


def _apply_clahe(image: np.ndarray) -> np.ndarray:
    """Apply CLAHE (contrast-limited adaptive histogram equalization) in LAB."""
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l_ch, a_ch, b_ch = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l_ch = clahe.apply(l_ch)
    return cv2.cvtColor(cv2.merge((l_ch, a_ch, b_ch)), cv2.COLOR_LAB2BGR)


def _blur_score(image: np.ndarray) -> float:
    """Return blur metric (Laplacian variance) on a downscaled copy."""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
    # Downsample for speed (blur metric doesn't need full res)
    if gray.shape[0] > 1024 or gray.shape[1] > 1024:
        gray = cv2.resize(gray, (min(1024, gray.shape[1]), min(1024, gray.shape[0])),
                          interpolation=cv2.INTER_AREA)
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())


def _apply_denoise(image: np.ndarray) -> np.ndarray:
    """Light denoising using fast non-local means."""
    return cv2.fastNlMeansDenoisingColored(image, None, 6, 6, 7, 21)


def _apply_sharpen(image: np.ndarray) -> np.ndarray:
    """Light unsharp mask."""
    blurred = cv2.GaussianBlur(image, (0, 0), 3)
    return cv2.addWeighted(image, 1.5, blurred, -0.5, 0)


# ═══════════════════════════════════════════════════════════════════════
# DPI estimation
# ═══════════════════════════════════════════════════════════════════════

def _estimate_dpi(pil_image: Image.Image, pdf_render_dpi: Optional[int] = None) -> Optional[int]:
    """Estimate DPI from PIL metadata, falling back to the render DPI."""
    info_dpi = pil_image.info.get("dpi")
    if info_dpi and info_dpi[0] > 0:
        return int(info_dpi[0])
    if pdf_render_dpi:
        return pdf_render_dpi
    return None


# ═══════════════════════════════════════════════════════════════════════
# Thumbnail / output encoding
# ═══════════════════════════════════════════════════════════════════════

def _save_output(np_image: np.ndarray, path: str) -> int:
    """Encode the processed page image to the configured output format.

    Returns the file size in bytes.
    """
    fmt = settings.page_output_format.lower()
    if fmt == "webp":
        pil = Image.fromarray(cv2.cvtColor(np_image, cv2.COLOR_BGR2RGB))
        pil.save(path, format="WEBP", quality=settings.page_output_quality, method=4)
    elif fmt == "png":
        # Use cv2 for faster PNG encoding with compression
        cv2.imwrite(path, np_image, [cv2.IMWRITE_PNG_COMPRESSION, 3])
    else:
        # Fallback JPEG
        cv2.imwrite(path, np_image, [cv2.IMWRITE_JPEG_QUALITY, settings.page_output_quality])
    return os.path.getsize(path)


def _save_thumbnail(np_image: np.ndarray, path: str) -> int:
    """Create a JPEG thumbnail capped at *thumb_max_dimension* on longest side.

    Returns the file size in bytes.
    """
    pil = Image.fromarray(cv2.cvtColor(np_image, cv2.COLOR_BGR2RGB))
    dim = settings.thumb_max_dimension
    pil.thumbnail((dim, dim), Image.LANCZOS)
    pil.save(path, format="JPEG", quality=settings.thumb_quality, optimize=True)
    return os.path.getsize(path)


# ═══════════════════════════════════════════════════════════════════════
# File extension for page output
# ═══════════════════════════════════════════════════════════════════════

def output_extension() -> str:
    fmt = settings.page_output_format.lower()
    return {"webp": ".webp", "png": ".png", "jpeg": ".jpg", "jpg": ".jpg"}.get(fmt, ".webp")


def output_mime_type() -> str:
    fmt = settings.page_output_format.lower()
    return {"webp": "image/webp", "png": "image/png", "jpeg": "image/jpeg", "jpg": "image/jpeg"}.get(fmt, "image/webp")


# ═══════════════════════════════════════════════════════════════════════
# PDF info
# ═══════════════════════════════════════════════════════════════════════

def get_pdf_page_count(file_path: str) -> int:
    """Return the number of pages in a PDF without rendering any pages."""
    try:
        info = pdfinfo_from_path(file_path)
        return int(info.get("Pages", 0))
    except Exception as exc:
        logger.warning("Could not determine PDF page count for %s: %s", file_path, exc)
        return 0


def get_pdf_info(file_path: str) -> dict:
    """Return rich PDF metadata without rendering."""
    try:
        info = pdfinfo_from_path(file_path)
        return {
            "pages": int(info.get("Pages", 0)),
            "title": info.get("Title", ""),
            "author": info.get("Author", ""),
            "creator": info.get("Creator", ""),
            "producer": info.get("Producer", ""),
            "page_size": info.get("Page size", ""),
            "encrypted": info.get("Encrypted", "no") != "no",
            "pdf_version": info.get("PDF version", ""),
        }
    except Exception as exc:
        logger.warning("Could not read PDF info for %s: %s", file_path, exc)
        return {"pages": 0, "error": str(exc)}


def validate_pdf(file_path: str) -> Tuple[bool, str]:
    """Quick validation: file exists, is non-empty, and poppler can read it."""
    if not os.path.isfile(file_path):
        return False, "File not found"
    size = os.path.getsize(file_path)
    if size == 0:
        return False, "File is empty"
    if size < 64:
        return False, "File too small to be a valid PDF"
    # Check magic bytes
    with open(file_path, "rb") as f:
        header = f.read(8)
    if not header.startswith(b"%PDF"):
        return False, "Not a valid PDF (missing %PDF header)"
    # Try poppler
    try:
        info = pdfinfo_from_path(file_path)
        pages = int(info.get("Pages", 0))
        if pages == 0:
            return False, "PDF has 0 pages"
    except Exception as exc:
        return False, f"PDF cannot be parsed: {exc}"
    return True, "ok"


def _select_render_dpi(total_pages: int) -> int:
    """Tiered DPI selection based on page count."""
    if total_pages > settings.pdf_xlarge_page_threshold:
        return settings.pdf_xlarge_render_dpi
    if total_pages > settings.pdf_large_page_threshold:
        return settings.pdf_large_render_dpi
    return settings.pdf_render_dpi


# ═══════════════════════════════════════════════════════════════════════
# Batched page iterator
# ═══════════════════════════════════════════════════════════════════════

def _iter_pdf_pages_batched(
    file_path: str,
    dpi: int,
    batch_size: int,
    total_pages: int,
    selected_pages: Optional[List[int]] = None,
) -> Generator[Tuple[int, Image.Image], None, None]:
    """Yield ``(page_number, pil_image)`` in batches to bound peak memory."""
    selected_set = set(selected_pages) if selected_pages else None
    thread_count = settings.pdf_poppler_thread_count

    for batch_start in range(1, total_pages + 1, batch_size):
        batch_end = min(batch_start + batch_size - 1, total_pages)

        if selected_set:
            needed = any(p in selected_set for p in range(batch_start, batch_end + 1))
            if not needed:
                continue

        logger.debug("Rendering pages %d–%d at %d DPI (threads=%d)",
                     batch_start, batch_end, dpi, thread_count)

        try:
            batch_images = convert_from_path(
                file_path,
                dpi=dpi,
                first_page=batch_start,
                last_page=batch_end,
                thread_count=thread_count,
                fmt="jpeg",  # JPEG intermediate = faster + less RAM than PPM
                jpegopt={"quality": 95},
            )
        except Exception as exc:
            logger.error("Failed to render pages %d–%d: %s", batch_start, batch_end, exc)
            # Yield None images so caller can mark pages as failed
            for page_num in range(batch_start, batch_end + 1):
                if selected_set and page_num not in selected_set:
                    continue
                yield page_num, None  # type: ignore[arg-type]
            continue

        for offset, pil_image in enumerate(batch_images):
            page_num = batch_start + offset
            if selected_set and page_num not in selected_set:
                continue
            yield page_num, pil_image

        del batch_images
        gc.collect()


# ═══════════════════════════════════════════════════════════════════════
# Enhancement pipeline
# ═══════════════════════════════════════════════════════════════════════

def _get_active_steps() -> List[str]:
    """Parse the configured enhancement pipeline into a list of step names."""
    raw = settings.enhancement_pipeline
    return [s.strip().lower() for s in raw.split(",") if s.strip()]


def _run_enhancement_pipeline(
    np_image: np.ndarray,
    metrics: PageMetrics,
) -> np.ndarray:
    """Run the configured enhancement steps adaptively."""
    steps = _get_active_steps()
    applied: List[str] = []

    for step in steps:
        if step == "deskew":
            angle = _detect_skew_angle(np_image)
            metrics.skew_angle = angle
            if abs(angle) >= 0.3:
                np_image = _apply_deskew(np_image, angle)
                applied.append(f"deskew({angle:.1f}°)")
            else:
                applied.append("deskew(skipped, <0.3°)")

        elif step == "auto_rotate":
            rot = _detect_cardinal_rotation(np_image)
            if rot != 0:
                np_image = _apply_cardinal_rotation(np_image, rot)
                applied.append(f"rotate({rot}°)")
            else:
                applied.append("rotate(skipped)")

        elif step == "clahe":
            cs = _contrast_score(np_image)
            metrics.contrast_score = cs
            if cs < settings.clahe_skip_threshold:
                np_image = _apply_clahe(np_image)
                applied.append(f"clahe(contrast={cs:.1f})")
            else:
                applied.append(f"clahe(skipped, contrast={cs:.1f} >= {settings.clahe_skip_threshold})")

        elif step == "denoise":
            np_image = _apply_denoise(np_image)
            applied.append("denoise")

        elif step == "sharpen":
            np_image = _apply_sharpen(np_image)
            applied.append("sharpen")

        else:
            logger.warning("Unknown enhancement step '%s', skipping", step)

    metrics.steps_applied = applied
    return np_image


# ═══════════════════════════════════════════════════════════════════════
# Single-page processor
# ═══════════════════════════════════════════════════════════════════════

def _process_page(
    pil_image: Image.Image,
    page_number: int,
    temp_dir: str,
    render_dpi: Optional[int] = None,
) -> ProcessedPage:
    """Process a single page image through the full pipeline.

    This function never raises.  On error it returns a ProcessedPage with
    outcome=FAILED and the error message.
    """
    metrics = PageMetrics()
    warnings: List[str] = []
    page_start = time.monotonic()
    ext = output_extension()
    page_path = os.path.join(temp_dir, f"page_{page_number:04d}{ext}")
    thumb_path = os.path.join(temp_dir, f"page_{page_number:04d}_thumb.jpg")

    try:
        # ── Clamp oversized pages ────────────────────────────────────
        pil_image, was_clamped = _clamp_page_size(pil_image)
        if was_clamped:
            warnings.append("oversized_page_downscaled")

        # ── Convert to numpy ─────────────────────────────────────────
        np_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
        h, w = np_image.shape[:2]
        metrics.input_pixels = w * h

        # ── Enhancement pipeline ─────────────────────────────────────
        with _timer() as t:
            np_image = _run_enhancement_pipeline(np_image, metrics)
        metrics.enhance_ms = t["ms"]

        h, w = np_image.shape[:2]
        metrics.output_pixels = w * h

        # ── Quality assessment ───────────────────────────────────────
        blur = _blur_score(np_image)
        metrics.blur_score = blur
        if blur < settings.blur_threshold:
            warnings.append("blur_detected")
        if min(h, w) < settings.min_resolution_short_side:
            warnings.append("low_resolution")

        # ── Encode output ────────────────────────────────────────────
        with _timer() as t:
            metrics.output_bytes = _save_output(np_image, page_path)
            metrics.thumb_bytes = _save_thumbnail(np_image, thumb_path)
        metrics.encode_ms = t["ms"]

        # Release large numpy array
        del np_image

        metrics.total_ms = (time.monotonic() - page_start) * 1000.0
        outcome = PageOutcome.WARN if warnings else PageOutcome.OK

        return ProcessedPage(
            page_number=page_number,
            width_px=w,
            height_px=h,
            dpi_estimated=_estimate_dpi(pil_image, render_dpi),
            warnings=warnings,
            png_path=page_path,
            thumb_path=thumb_path,
            outcome=outcome,
            metrics=metrics,
        )

    except Exception as exc:
        metrics.total_ms = (time.monotonic() - page_start) * 1000.0
        logger.exception("Page %d processing failed", page_number)
        # Create placeholder files so the caller doesn't crash
        _write_placeholder(page_path)
        _write_placeholder(thumb_path)
        return ProcessedPage(
            page_number=page_number,
            width_px=0,
            height_px=0,
            dpi_estimated=None,
            warnings=["processing_failed"],
            png_path=page_path,
            thumb_path=thumb_path,
            outcome=PageOutcome.FAILED,
            error=str(exc)[:500],
            metrics=metrics,
        )


def _write_placeholder(path: str) -> None:
    """Write a tiny 1x1 gray pixel image as a placeholder for failed pages."""
    try:
        img = Image.new("RGB", (1, 1), (128, 128, 128))
        if path.endswith(".jpg") or path.endswith(".jpeg"):
            img.save(path, "JPEG")
        elif path.endswith(".webp"):
            img.save(path, "WEBP")
        else:
            img.save(path, "PNG")
    except Exception:
        # Last resort: write an empty file so os.path.exists works
        open(path, "wb").close()


# ═══════════════════════════════════════════════════════════════════════
# Public API
# ═══════════════════════════════════════════════════════════════════════

def process_file(
    file_path: str,
    mime_type: str,
    selected_pages: Optional[List[int]] = None,
    progress_callback: Optional[Callable[[int, int], None]] = None,
) -> ProcessedUpload:
    """Process an uploaded file (PDF, image, or TIFF) and return page results.

    For PDFs, pages are rendered in configurable batches.  Each page is
    processed independently; failures are isolated per page.
    """
    overall_start = time.monotonic()
    upload_warnings: List[str] = []
    pages: List[ProcessedPage] = []
    temp_dir = tempfile.mkdtemp(prefix="processed_")
    total_page_count = 0
    file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0

    # ── PDF path ─────────────────────────────────────────────────────
    if mime_type == "application/pdf":
        ok, msg = validate_pdf(file_path)
        if not ok:
            upload_warnings.append(f"PDF validation failed: {msg}")
            return ProcessedUpload(
                upload_warnings=upload_warnings, pages=[],
                total_page_count=0, file_size_bytes=file_size,
            )

        total_page_count = get_pdf_page_count(file_path)

        if total_page_count > settings.pdf_max_pages:
            upload_warnings.append(
                f"PDF has {total_page_count} pages; capped at {settings.pdf_max_pages}"
            )
            effective_total = settings.pdf_max_pages
        else:
            effective_total = total_page_count

        dpi = _select_render_dpi(effective_total)
        batch_size = settings.pdf_page_batch_size

        if dpi < settings.pdf_render_dpi:
            upload_warnings.append(
                f"Rendering at {dpi} DPI (reduced from {settings.pdf_render_dpi}) "
                f"for {total_page_count}-page PDF"
            )

        logger.info(
            "Processing PDF: pages=%d, effective=%d, dpi=%d, batch=%d, size=%s",
            total_page_count, effective_total, dpi, batch_size,
            _human_size(file_size),
        )

        if selected_pages:
            selected_pages = [p for p in selected_pages if 1 <= p <= effective_total]

        processed_count = 0
        total_to_process = len(selected_pages) if selected_pages else effective_total

        for page_num, pil_image in _iter_pdf_pages_batched(
            file_path, dpi, batch_size, effective_total, selected_pages,
        ):
            if pil_image is None:
                # Batch render failed for this page
                pages.append(ProcessedPage(
                    page_number=page_num, width_px=0, height_px=0,
                    dpi_estimated=None, warnings=["render_failed"],
                    png_path="", thumb_path="",
                    outcome=PageOutcome.FAILED, error="PDF page render failed",
                ))
            else:
                with _timer() as render_t:
                    pass  # render time is in the batch iterator
                page_result = _process_page(pil_image, page_num, temp_dir, dpi)
                pages.append(page_result)

            processed_count += 1
            if progress_callback:
                progress_callback(processed_count, total_to_process)

            # Release PIL image ASAP
            if pil_image is not None:
                del pil_image
            if processed_count % settings.pdf_page_batch_size == 0:
                gc.collect()

    # ── TIFF (multi-page) path ───────────────────────────────────────
    elif mime_type in ("image/tiff", "image/tif"):
        try:
            tiff = Image.open(file_path)
            frame_count = 0
            while True:
                try:
                    tiff.seek(frame_count)
                    frame_count += 1
                except EOFError:
                    break

            total_page_count = frame_count
            logger.info("Processing TIFF: %d frames", frame_count)

            for i in range(frame_count):
                if selected_pages and (i + 1) not in selected_pages:
                    continue
                tiff.seek(i)
                pil_image = tiff.convert("RGB")
                page_result = _process_page(pil_image, i + 1, temp_dir)
                pages.append(page_result)
                if progress_callback:
                    total = len(selected_pages) if selected_pages else frame_count
                    progress_callback(len(pages), total)
                del pil_image
        except Exception as exc:
            logger.exception("TIFF processing failed")
            upload_warnings.append(f"TIFF error: {exc}")

    # ── Single image path ────────────────────────────────────────────
    else:
        total_page_count = 1
        try:
            pil_image = Image.open(file_path).convert("RGB")
            page_result = _process_page(pil_image, 1, temp_dir)
            pages.append(page_result)
            if progress_callback:
                progress_callback(1, 1)
        except Exception as exc:
            logger.exception("Image processing failed")
            upload_warnings.append(f"Image error: {exc}")

    if not pages:
        upload_warnings.append("No pages processed")

    ok_count = sum(1 for p in pages if p.outcome == PageOutcome.OK)
    warn_count = sum(1 for p in pages if p.outcome == PageOutcome.WARN)
    failed_count = sum(1 for p in pages if p.outcome == PageOutcome.FAILED)
    total_ms = (time.monotonic() - overall_start) * 1000.0

    logger.info(
        "Processing complete: %d ok, %d warn, %d failed (%.1fs total)",
        ok_count, warn_count, failed_count, total_ms / 1000.0,
    )

    return ProcessedUpload(
        upload_warnings=upload_warnings,
        pages=pages,
        total_page_count=total_page_count,
        file_size_bytes=file_size,
        ok_count=ok_count,
        warn_count=warn_count,
        failed_count=failed_count,
        total_processing_ms=total_ms,
    )


def _human_size(size_bytes: int) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if abs(size_bytes) < 1024:
            return f"{size_bytes:.1f}{unit}"
        size_bytes /= 1024  # type: ignore[assignment]
    return f"{size_bytes:.1f}TB"
