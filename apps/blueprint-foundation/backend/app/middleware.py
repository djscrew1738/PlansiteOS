"""Custom middleware for rate limiting and security."""
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from app.config import settings
import time
from collections import defaultdict
from threading import Lock


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware for upload endpoints."""

    def __init__(self, app):
        super().__init__(app)
        self.requests = defaultdict(list)
        self.lock = Lock()

    async def dispatch(self, request: Request, call_next):
        """Process request with rate limiting.

        Args:
            request: FastAPI request
            call_next: Next middleware/endpoint

        Returns:
            Response

        Raises:
            HTTPException: If rate limit exceeded
        """
        # Only rate limit upload endpoints
        if "/uploads" in request.url.path and request.method == "POST":
            client_ip = request.client.host
            current_time = time.time()

            with self.lock:
                # Clean old requests (older than 1 minute)
                self.requests[client_ip] = [
                    req_time for req_time in self.requests[client_ip]
                    if current_time - req_time < 60
                ]

                # Check rate limit
                if len(self.requests[client_ip]) >= settings.rate_limit_per_minute:
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="Too many upload requests. Please try again later."
                    )

                # Add current request
                self.requests[client_ip].append(current_time)

        response = await call_next(request)
        return response
