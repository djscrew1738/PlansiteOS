"""PDF processing module using pdf2image and pdfplumber."""
from pdf2image import convert_from_bytes
from typing import List, Dict
from PIL import Image
import io
import pdfplumber
import gc


class PDFProcessor:
    """PDF processor for converting PDF pages to images."""

    def __init__(self, dpi: int = 300):
        """Initialize processor.

        Args:
            dpi: DPI for PDF rendering
        """
        self.dpi = dpi

    def extract_pages(self, pdf_data: bytes, selected_pages: List[int] = None) -> List[Dict]:
        """Extract pages from PDF with memory-efficient streaming.

        Args:
            pdf_data: PDF file bytes
            selected_pages: List of page numbers to extract (1-indexed), or None for all

        Returns:
            List of page dicts with page_number and image_bytes
        """
        try:
            # Get total page count without rendering
            page_count = self._get_page_count_fast(pdf_data)

            # Determine which pages to process
            pages_to_extract = selected_pages if selected_pages else list(range(1, page_count + 1))

            # Convert only selected pages to reduce memory usage
            images = convert_from_bytes(
                pdf_data,
                dpi=self.dpi,
                fmt='png',
                first_page=min(pages_to_extract) if pages_to_extract else 1,
                last_page=max(pages_to_extract) if pages_to_extract else page_count,
            )

            results = []
            page_offset = min(pages_to_extract) if pages_to_extract else 1

            for idx, image in enumerate(images):
                page_number = page_offset + idx

                # Check if this page is selected
                if selected_pages and page_number not in selected_pages:
                    continue

                # Convert PIL Image to bytes
                img_byte_arr = io.BytesIO()
                image.save(img_byte_arr, format='PNG')
                img_bytes = img_byte_arr.getvalue()

                results.append({
                    "page_number": page_number,
                    "image_bytes": img_bytes,
                    "width": image.width,
                    "height": image.height,
                })

                # Free memory after processing each image
                del image
                gc.collect()

            return results

        except Exception as e:
            raise Exception(f"Failed to process PDF: {str(e)}")

    def _get_page_count_fast(self, pdf_data: bytes) -> int:
        """Get page count efficiently using pdfplumber (no rendering).

        Args:
            pdf_data: PDF file bytes

        Returns:
            Number of pages
        """
        try:
            with pdfplumber.open(io.BytesIO(pdf_data)) as pdf:
                return len(pdf.pages)
        except Exception as e:
            raise Exception(f"Failed to count PDF pages: {str(e)}")

    def get_page_count(self, pdf_data: bytes) -> int:
        """Get number of pages in PDF.

        Args:
            pdf_data: PDF file bytes

        Returns:
            Number of pages
        """
        return self._get_page_count_fast(pdf_data)

    def suggest_pages(self, pdf_data: bytes) -> List[int]:
        """Suggest which pages to process based on heuristics.

        Args:
            pdf_data: PDF file bytes

        Returns:
            List of suggested page numbers (1-indexed)
        """
        try:
            # For now, suggest all pages
            # In a real implementation, you might analyze page content
            # and suggest only pages that look like blueprints
            page_count = self.get_page_count(pdf_data)
            return list(range(1, page_count + 1))
        except Exception:
            return []
