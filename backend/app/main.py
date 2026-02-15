"""
OpenPlaces Backend API
Strategic Ad Placement Recommender for Arlington, VA
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv
from app.routes import webhooks

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="OpenPlaces API",
    description="Strategic Ad Placement Recommender for Arlington, VA",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration - will be configured in Story 1.3
# Placeholder for now
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
# Story 2.5: Clerk webhook endpoint
app.include_router(webhooks.router)


@app.get("/")
async def root():
    """Root endpoint - API information"""
    return {
        "name": "OpenPlaces API",
        "version": "0.1.0",
        "description": "Strategic Ad Placement Recommender for Arlington, VA",
        "docs": "/docs",
    }


@app.get("/api/health")
async def health_check():
    """
    Health check endpoint for frontend-backend communication testing
    Story 1.3 Acceptance Criteria: Returns {"status": "ok"}
    """
    return {"status": "ok"}


@app.get("/api/status")
async def api_status():
    """
    Extended status endpoint showing configuration state
    """
    return {
        "status": "running",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "features": {
            "openai_configured": bool(os.getenv("OPENAI_API_KEY")),
            "supabase_configured": bool(os.getenv("SUPABASE_URL")),
            "mapbox_configured": bool(os.getenv("MAPBOX_API_KEY")),
        },
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Auto-reload for development (Story 1.2 AC)
        log_level="info",
    )
