import io
import logging
import os
from typing import BinaryIO, Iterable, Optional

import boto3
from boto3.s3.transfer import TransferConfig
from botocore.client import Config
from botocore.exceptions import ClientError

from .config import settings

logger = logging.getLogger(__name__)

# Multipart threshold: files larger than this use multipart upload (10 MB)
_MULTIPART_THRESHOLD = 10 * 1024 * 1024
# Each part size for multipart uploads (10 MB)
_MULTIPART_CHUNK_SIZE = 10 * 1024 * 1024
# Max parallel upload threads
_MAX_CONCURRENCY = 4
# Download chunk size for streaming (1 MB)
_DOWNLOAD_CHUNK_SIZE = 1024 * 1024


class StorageClient:
    def __init__(self) -> None:
        self.client = boto3.client(
            "s3",
            endpoint_url=settings.s3_endpoint,
            aws_access_key_id=settings.s3_access_key,
            aws_secret_access_key=settings.s3_secret_key,
            region_name=settings.s3_region,
            use_ssl=settings.s3_secure,
            config=Config(signature_version="s3v4"),
        )
        self._transfer_config = TransferConfig(
            multipart_threshold=_MULTIPART_THRESHOLD,
            multipart_chunksize=_MULTIPART_CHUNK_SIZE,
            max_concurrency=_MAX_CONCURRENCY,
        )

    # ------------------------------------------------------------------
    # Upload helpers
    # ------------------------------------------------------------------

    def upload_bytes(self, key: str, data: bytes, content_type: str) -> None:
        """Upload bytes directly.  For payloads larger than the multipart
        threshold the SDK will transparently switch to multipart upload."""
        self.client.put_object(
            Bucket=settings.s3_bucket,
            Key=key,
            Body=data,
            ContentType=content_type,
        )

    def upload_file(self, key: str, file_path: str, content_type: str) -> None:
        """Upload a local file using the managed transfer (multipart for large
        files, single PUT for small ones)."""
        self.client.upload_file(
            file_path,
            settings.s3_bucket,
            key,
            ExtraArgs={"ContentType": content_type},
            Config=self._transfer_config,
        )

    def upload_stream(
        self,
        key: str,
        stream: BinaryIO,
        content_type: str,
        content_length: Optional[int] = None,
    ) -> None:
        """Stream-upload a file-like object.  When *content_length* is known
        and exceeds the multipart threshold the upload is split into parts
        transparently by the SDK."""
        extra = {"ContentType": content_type}
        self.client.upload_fileobj(
            stream,
            settings.s3_bucket,
            key,
            ExtraArgs=extra,
            Config=self._transfer_config,
        )

    # ------------------------------------------------------------------
    # Download helpers
    # ------------------------------------------------------------------

    def get_stream(self, key: str) -> Iterable[bytes]:
        obj = self.client.get_object(Bucket=settings.s3_bucket, Key=key)
        body = obj["Body"]
        for chunk in iter(lambda: body.read(_DOWNLOAD_CHUNK_SIZE), b""):
            yield chunk

    def download_file(self, key: str, dest_path: str) -> None:
        """Download an S3 object directly to a local file path with managed
        transfer (multipart for large objects)."""
        self.client.download_file(
            settings.s3_bucket,
            key,
            dest_path,
            Config=self._transfer_config,
        )

    def get_size(self, key: str) -> int:
        """Return the size in bytes of the object at *key*."""
        resp = self.client.head_object(Bucket=settings.s3_bucket, Key=key)
        return int(resp["ContentLength"])

    # ------------------------------------------------------------------
    # Utility
    # ------------------------------------------------------------------

    def exists(self, key: str) -> bool:
        try:
            self.client.head_object(Bucket=settings.s3_bucket, Key=key)
            return True
        except ClientError:
            return False


storage_client = StorageClient()
