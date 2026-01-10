"""Image processing module using OpenCV."""
import cv2
import numpy as np
from typing import Tuple, Dict, List, Optional
import tempfile
import os


class ImageProcessor:
    """Image processor for blueprint normalization."""

    def __init__(self, target_dpi: int = 300, blur_threshold: float = 100.0, low_res_threshold: int = 1800):
        """Initialize processor.

        Args:
            target_dpi: Target DPI for output
            blur_threshold: Laplacian variance threshold for blur detection
            low_res_threshold: Minimum pixel dimension threshold
        """
        self.target_dpi = target_dpi
        self.blur_threshold = blur_threshold
        self.low_res_threshold = low_res_threshold

    def process_image(self, image_data: bytes, output_dir: str, page_number: int = 1) -> Dict:
        """Process a single image.

        Args:
            image_data: Raw image bytes
            output_dir: Output directory for processed files
            page_number: Page number

        Returns:
            Processing result dict with warnings and file paths
        """
        # Decode image
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return {
                "success": False,
                "error": "Failed to decode image",
            }

        # Process image
        warnings = []

        # 1. Check resolution
        height, width = img.shape[:2]
        min_dimension = min(width, height)
        if min_dimension < self.low_res_threshold:
            warnings.append(f"Low resolution: {width}x{height}px (shortest side < {self.low_res_threshold}px)")

        # 2. Detect blur
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blur_score = self._calculate_blur_score(gray)
        if blur_score < self.blur_threshold:
            warnings.append(f"Image may be blurry (score: {blur_score:.1f})")

        # 3. Deskew
        deskewed, angle = self._deskew_image(gray, img)

        # 4. Auto-rotate to nearest 90-degree angle
        rotated = self._auto_rotate(deskewed)

        # 5. Apply CLAHE contrast enhancement
        enhanced = self._apply_clahe(rotated)

        # 6. Generate thumbnail
        thumbnail = self._generate_thumbnail(enhanced, max_size=400)

        # Save processed files
        page_filename = f"page_{page_number:02d}.png"
        thumb_filename = f"page_{page_number:02d}.jpg"

        page_path = os.path.join(output_dir, page_filename)
        thumb_path = os.path.join(output_dir, thumb_filename)

        cv2.imwrite(page_path, enhanced, [cv2.IMWRITE_PNG_COMPRESSION, 6])
        cv2.imwrite(thumb_path, thumbnail, [cv2.IMWRITE_JPEG_QUALITY, 85])

        # Get final dimensions
        final_height, final_width = enhanced.shape[:2]

        # Estimate DPI (rough approximation)
        dpi_estimated = self._estimate_dpi(final_width, final_height)

        return {
            "success": True,
            "page_number": page_number,
            "width_px": final_width,
            "height_px": final_height,
            "dpi_estimated": dpi_estimated,
            "warnings": warnings,
            "page_path": page_path,
            "thumb_path": thumb_path,
            "rotation_applied": angle,
        }

    def _calculate_blur_score(self, gray: np.ndarray) -> float:
        """Calculate blur score using Laplacian variance.

        Args:
            gray: Grayscale image

        Returns:
            Blur score (higher = sharper)
        """
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        return laplacian.var()

    def _deskew_image(self, gray: np.ndarray, color: np.ndarray) -> Tuple[np.ndarray, float]:
        """Deskew image using Hough line detection.

        Args:
            gray: Grayscale image
            color: Color image

        Returns:
            Deskewed image and rotation angle
        """
        # Detect edges
        edges = cv2.Canny(gray, 50, 150, apertureSize=3)

        # Detect lines
        lines = cv2.HoughLines(edges, 1, np.pi / 180, 200)

        if lines is None or len(lines) == 0:
            return color, 0.0

        # Calculate dominant angle
        angles = []
        for rho, theta in lines[:, 0]:
            angle = (theta * 180 / np.pi) - 90
            # Normalize to -45 to 45 degrees
            if angle < -45:
                angle += 90
            elif angle > 45:
                angle -= 90
            angles.append(angle)

        # Get median angle
        median_angle = np.median(angles)

        # Only rotate if angle is significant (> 0.5 degrees)
        if abs(median_angle) < 0.5:
            return color, 0.0

        # Rotate image
        height, width = color.shape[:2]
        center = (width // 2, height // 2)
        matrix = cv2.getRotationMatrix2D(center, median_angle, 1.0)
        rotated = cv2.warpAffine(color, matrix, (width, height), flags=cv2.INTER_LINEAR, borderValue=(255, 255, 255))

        return rotated, median_angle

    def _auto_rotate(self, img: np.ndarray) -> np.ndarray:
        """Auto-rotate image to nearest 90-degree angle based on aspect ratio.

        Args:
            img: Input image

        Returns:
            Rotated image
        """
        height, width = img.shape[:2]

        # If height > width significantly, might need rotation
        # This is a simple heuristic; real blueprints are typically landscape
        if height > width * 1.2:
            # Try rotating 90 degrees
            img = cv2.rotate(img, cv2.ROTATE_90_CLOCKWISE)

        return img

    def _apply_clahe(self, img: np.ndarray) -> np.ndarray:
        """Apply CLAHE (Contrast Limited Adaptive Histogram Equalization).

        Args:
            img: Input image

        Returns:
            Enhanced image
        """
        # Convert to LAB color space
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)

        # Apply CLAHE to L channel
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l_enhanced = clahe.apply(l)

        # Merge channels
        lab_enhanced = cv2.merge([l_enhanced, a, b])

        # Convert back to BGR
        enhanced = cv2.cvtColor(lab_enhanced, cv2.COLOR_LAB2BGR)

        return enhanced

    def _generate_thumbnail(self, img: np.ndarray, max_size: int = 400) -> np.ndarray:
        """Generate thumbnail maintaining aspect ratio.

        Args:
            img: Input image
            max_size: Maximum dimension

        Returns:
            Thumbnail image
        """
        height, width = img.shape[:2]

        if max(width, height) <= max_size:
            return img

        # Calculate scale
        if width > height:
            scale = max_size / width
        else:
            scale = max_size / height

        new_width = int(width * scale)
        new_height = int(height * scale)

        thumbnail = cv2.resize(img, (new_width, new_height), interpolation=cv2.INTER_AREA)
        return thumbnail

    def _estimate_dpi(self, width: int, height: int) -> int:
        """Estimate DPI based on image dimensions.

        Args:
            width: Image width
            height: Image height

        Returns:
            Estimated DPI
        """
        # Assume blueprints are typically 24"x36" or similar
        # This is a rough heuristic
        max_dimension = max(width, height)

        if max_dimension >= 10000:
            return 400
        elif max_dimension >= 7000:
            return 300
        elif max_dimension >= 5000:
            return 200
        else:
            return 150
