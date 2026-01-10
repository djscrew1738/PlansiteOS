import io
from typing import Iterable
import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from .config import settings


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

    def upload_bytes(self, key: str, data: bytes, content_type: str) -> None:
        self.client.put_object(
            Bucket=settings.s3_bucket,
            Key=key,
            Body=data,
            ContentType=content_type,
        )

    def upload_file(self, key: str, file_path: str, content_type: str) -> None:
        self.client.upload_file(
            file_path,
            settings.s3_bucket,
            key,
            ExtraArgs={"ContentType": content_type},
        )

    def get_stream(self, key: str) -> Iterable[bytes]:
        obj = self.client.get_object(Bucket=settings.s3_bucket, Key=key)
        body = obj["Body"]
        for chunk in iter(lambda: body.read(1024 * 1024), b""):
            yield chunk

    def exists(self, key: str) -> bool:
        try:
            self.client.head_object(Bucket=settings.s3_bucket, Key=key)
            return True
        except ClientError:
            return False


storage_client = StorageClient()
