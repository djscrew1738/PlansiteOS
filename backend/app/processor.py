import tempfile
from dataclasses import dataclass
from typing import List, Optional
import cv2
import numpy as np
from pdf2image import convert_from_path
from PIL import Image


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


BLUR_THRESHOLD = 120.0
MIN_SHORT_SIDE = 1800


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


def process_file(file_path: str, mime_type: str, selected_pages: Optional[List[int]] = None) -> ProcessedUpload:
    upload_warnings: List[str] = []
    pages: List[ProcessedPage] = []
    temp_dir = tempfile.mkdtemp(prefix="processed_")

    if mime_type == "application/pdf":
        images = convert_from_path(file_path, dpi=350)
        for idx, pil_image in enumerate(images, start=1):
            if selected_pages and idx not in selected_pages:
                continue
            pages.append(_process_page(pil_image, idx, temp_dir))
    else:
        pil_image = Image.open(file_path).convert("RGB")
        pages.append(_process_page(pil_image, 1, temp_dir))

    if not pages:
        upload_warnings.append("No pages processed")

    return ProcessedUpload(upload_warnings=upload_warnings, pages=pages)


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
