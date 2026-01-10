import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
import redis
from .config import settings


class UploadRateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.redis = redis.Redis.from_url(settings.redis_url, decode_responses=True)

    async def dispatch(self, request: Request, call_next):
        if request.url.path.endswith("/uploads") and request.method == "POST":
            client_ip = request.client.host if request.client else "unknown"
            key = f"upload_rate:{client_ip}"
            current = self.redis.incr(key)
            if current == 1:
                self.redis.expire(key, settings.upload_rate_window_seconds)
            if current > settings.upload_rate_limit:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Rate limit exceeded"},
                )
        return await call_next(request)
