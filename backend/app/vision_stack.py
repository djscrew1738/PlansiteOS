from dataclasses import dataclass
from typing import List


@dataclass(frozen=True)
class VisionTooling:
    name: str
    purpose: str


def get_vision_stack() -> List[VisionTooling]:
    return [
        VisionTooling(name="OpenCV", purpose="Image preprocessing and geometry"),
        VisionTooling(name="YOLOv8", purpose="Object detection and instance segmentation"),
        VisionTooling(name="PaddleOCR", purpose="OCR for plan annotations"),
        VisionTooling(name="PyTorch", purpose="Model runtime for deep learning"),
        VisionTooling(name="VTracer", purpose="Raster-to-vector conversion"),
        VisionTooling(name="PyMuPDF", purpose="PDF rendering and extraction"),
        VisionTooling(name="scikit-image", purpose="Image filters and segmentation"),
        VisionTooling(name="ezdxf", purpose="DXF generation"),
        VisionTooling(name="Shapely", purpose="Geometric analysis and topology"),
        VisionTooling(name="NetworkX", purpose="Graph modeling for pipelines"),
    ]
