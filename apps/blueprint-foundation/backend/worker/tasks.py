"""Background job tasks for blueprint processing."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.database import SessionLocal
from app.models import Upload, Page, UploadStatus, PageStatus
from app.storage import storage_client
from app.config import settings
from processor.image_processor import ImageProcessor
from processor.pdf_processor import PDFProcessor
from uuid import UUID
import tempfile
import shutil


def process_upload(upload_id: str):
    """Process an uploaded blueprint file.

    Args:
        upload_id: Upload UUID string

    This task:
    1. Fetches the original file from storage
    2. Splits PDF into pages or processes single image
    3. Enhances each page (deskew, rotate, CLAHE)
    4. Generates thumbnails
    5. Detects quality issues
    6. Uploads processed files to storage
    7. Creates Page records in database
    8. Updates Upload status
    """
    db = SessionLocal()

    try:
        # Get upload record
        upload = db.query(Upload).filter(Upload.id == UUID(upload_id)).first()
        if not upload:
            print(f"Upload {upload_id} not found")
            return

        # Update status to PROCESSING
        upload.status = UploadStatus.PROCESSING
        upload.progress = ["queued"]
        db.commit()

        # Step 1: Fetch original file
        upload.progress.append("fetching")
        db.commit()

        original_data = storage_client.download_file(upload.storage_key_original)
        if not original_data:
            raise Exception("Failed to download original file from storage")

        # Create temp directory for processing
        with tempfile.TemporaryDirectory() as temp_dir:
            # Step 2: Convert/split based on file type
            upload.progress.append("converting")
            db.commit()

            pages_to_process = []

            if upload.mime_type == "application/pdf":
                # PDF: extract pages
                pdf_processor = PDFProcessor(dpi=settings.image_target_dpi)

                # Check if page selection exists in progress metadata
                selected_pages = None
                if upload.progress and any("Pages selected:" in p for p in upload.progress):
                    # Extract page numbers from progress
                    for p in upload.progress:
                        if "Pages selected:" in p:
                            # Parse "[1, 2, 3]" from string
                            import json
                            try:
                                page_str = p.split("Pages selected:")[1].strip()
                                selected_pages = json.loads(page_str)
                            except:
                                pass
                            break

                pdf_pages = pdf_processor.extract_pages(original_data, selected_pages)

                for page_data in pdf_pages:
                    pages_to_process.append({
                        "page_number": page_data["page_number"],
                        "image_bytes": page_data["image_bytes"],
                    })

            else:
                # Single image
                pages_to_process.append({
                    "page_number": 1,
                    "image_bytes": original_data,
                })

            # Step 3-5: Process each page
            upload.progress.append("enhancing")
            db.commit()

            image_processor = ImageProcessor(
                target_dpi=settings.image_target_dpi,
                blur_threshold=settings.blur_threshold,
                low_res_threshold=settings.low_res_threshold,
            )

            processed_pages = []
            upload_warnings = []

            for page_info in pages_to_process:
                result = image_processor.process_image(
                    page_info["image_bytes"],
                    temp_dir,
                    page_info["page_number"]
                )

                if not result["success"]:
                    upload_warnings.append(f"Page {page_info['page_number']}: {result['error']}")
                    continue

                processed_pages.append(result)

                # Collect warnings
                if result["warnings"]:
                    upload_warnings.extend([f"Page {page_info['page_number']}: {w}" for w in result["warnings"]])

            if not processed_pages:
                raise Exception("No pages were successfully processed")

            # Step 6: Upload processed files to storage
            upload.progress.append("uploading_pages")
            db.commit()

            for page_result in processed_pages:
                page_num = page_result["page_number"]

                # Read processed files
                with open(page_result["page_path"], "rb") as f:
                    page_data = f.read()
                with open(page_result["thumb_path"], "rb") as f:
                    thumb_data = f.read()

                # Generate storage keys
                page_key = f"projects/{upload.project_id}/uploads/{upload.id}/pages/page_{page_num:02d}.png"
                thumb_key = f"projects/{upload.project_id}/uploads/{upload.id}/thumbs/page_{page_num:02d}.jpg"

                # Upload to storage
                storage_client.upload_file(page_key, page_data, "image/png")
                storage_client.upload_file(thumb_key, thumb_data, "image/jpeg")

                # Store for database insertion
                page_result["storage_key_page_png"] = page_key
                page_result["storage_key_page_thumb"] = thumb_key

            # Step 7: Insert Page records
            upload.progress.append("writing_db")
            db.commit()

            for page_result in processed_pages:
                page = Page(
                    upload_id=upload.id,
                    page_number=page_result["page_number"],
                    width_px=page_result["width_px"],
                    height_px=page_result["height_px"],
                    dpi_estimated=page_result["dpi_estimated"],
                    storage_key_page_png=page_result["storage_key_page_png"],
                    storage_key_page_thumb=page_result["storage_key_page_thumb"],
                    status=PageStatus.READY,
                    warnings=page_result["warnings"] if page_result["warnings"] else None,
                )
                db.add(page)

            # Step 8: Update upload status
            upload.status = UploadStatus.READY
            upload.warnings = upload_warnings if upload_warnings else None
            upload.progress.append("done")
            upload.error_message = None

            db.commit()

            print(f"Successfully processed upload {upload_id}: {len(processed_pages)} pages")

    except Exception as e:
        print(f"Error processing upload {upload_id}: {str(e)}")

        # Update upload status to FAILED
        try:
            upload = db.query(Upload).filter(Upload.id == UUID(upload_id)).first()
            if upload:
                upload.status = UploadStatus.FAILED
                upload.error_message = str(e)
                db.commit()
        except Exception as db_error:
            print(f"Failed to update error status: {db_error}")

    finally:
        db.close()
