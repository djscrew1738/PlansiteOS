"""FastAPI application entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.middleware import RateLimitMiddleware
from app.routers import projects, uploads, upload_detail, pages, health, summary

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add rate limiting middleware
app.add_middleware(RateLimitMiddleware)

# Include routers
app.include_router(health.router, prefix=settings.api_prefix)
app.include_router(projects.router, prefix=settings.api_prefix)
app.include_router(uploads.router, prefix=settings.api_prefix)
app.include_router(upload_detail.router, prefix=settings.api_prefix)
app.include_router(pages.router, prefix=settings.api_prefix)
app.include_router(summary.router, prefix=settings.api_prefix)


@app.get("/")
def root():
    """Root endpoint."""
    return {
        "message": "Blueprint Upload Foundation API",
        "version": "1.0.0",
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
