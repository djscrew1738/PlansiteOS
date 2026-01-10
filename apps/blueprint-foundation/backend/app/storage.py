"""Object storage client (MinIO/S3)."""
from minio import Minio
from minio.error import S3Error
from app.config import settings
import io
from typing import Optional
from datetime import timedelta


class StorageClient:
    """Storage client wrapper for MinIO/S3."""

    def __init__(self):
        """Initialize storage client."""
        self.client = Minio(
            settings.storage_endpoint,
            access_key=settings.storage_access_key,
            secret_key=settings.storage_secret_key,
            secure=settings.storage_secure,
            region=settings.storage_region,
        )
        self.bucket = settings.storage_bucket
        self._ensure_bucket()

    def _ensure_bucket(self):
        """Ensure bucket exists."""
        try:
            if not self.client.bucket_exists(self.bucket):
                self.client.make_bucket(self.bucket)
        except S3Error as e:
            print(f"Error ensuring bucket exists: {e}")

    def upload_file(self, object_name: str, file_data: bytes, content_type: str) -> bool:
        """Upload file to storage.

        Args:
            object_name: Object key/path
            file_data: File bytes
            content_type: MIME type

        Returns:
            Success status
        """
        try:
            self.client.put_object(
                self.bucket,
                object_name,
                io.BytesIO(file_data),
                length=len(file_data),
                content_type=content_type,
            )
            return True
        except S3Error as e:
            print(f"Error uploading file {object_name}: {e}")
            return False

    def download_file(self, object_name: str) -> Optional[bytes]:
        """Download file from storage.

        Args:
            object_name: Object key/path

        Returns:
            File bytes or None if error
        """
        try:
            response = self.client.get_object(self.bucket, object_name)
            data = response.read()
            response.close()
            response.release_conn()
            return data
        except S3Error as e:
            print(f"Error downloading file {object_name}: {e}")
            return None

    def get_signed_url(self, object_name: str, expires: int = 3600) -> Optional[str]:
        """Get presigned URL for object.

        Args:
            object_name: Object key/path
            expires: Expiry time in seconds

        Returns:
            Signed URL or None if error
        """
        try:
            url = self.client.presigned_get_object(
                self.bucket,
                object_name,
                expires=timedelta(seconds=expires),
            )
            return url
        except S3Error as e:
            print(f"Error generating signed URL for {object_name}: {e}")
            return None

    def delete_file(self, object_name: str) -> bool:
        """Delete file from storage.

        Args:
            object_name: Object key/path

        Returns:
            Success status
        """
        try:
            self.client.remove_object(self.bucket, object_name)
            return True
        except S3Error as e:
            print(f"Error deleting file {object_name}: {e}")
            return False


# Global storage client instance
storage_client = StorageClient()
