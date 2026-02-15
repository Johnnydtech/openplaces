"""
Story 3.2: OpenAI Vision API Integration - /api/analyze endpoint
Receives uploaded flyers and returns extracted event details
"""

import logging
from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from app.services.vision import analyze_flyer, VisionAnalysisError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["analyze"])


@router.post("/analyze")
async def analyze_flyer_endpoint(file: UploadFile = File(...)):
    """
    Analyze uploaded event flyer with OpenAI Vision API

    Story 3.2 Acceptance Criteria:
    - Backend /api/analyze endpoint calls OpenAI Vision API
    - GPT-4 Vision extracts: name, date, time, venue, audience
    - Response within 45 seconds (timeout)
    - Returns JSON
    - Errors logged with fallback message
    - API costs logged

    Args:
        file: Uploaded flyer image (JPG, PNG) or PDF

    Returns:
        JSON with extracted event details:
        {
            "success": true,
            "data": {
                "event_name": str,
                "event_date": str,
                "event_time": str,
                "venue": str,
                "target_audience": list[str],
                "confidence": str,
                "extraction_notes": str
            }
        }

    Errors:
        400: Invalid file type or size
        500: AI extraction failed
        504: Timeout (>45 seconds)
    """
    try:
        # Validate file type
        allowed_types = ["image/jpeg", "image/png", "application/pdf"]
        if file.content_type not in allowed_types:
            logger.warning(f"Invalid file type uploaded: {file.content_type}")
            raise HTTPException(
                status_code=400,
                detail=f"File type not supported. Please upload JPG, PNG, or PDF.",
            )

        # Validate file size (max 10MB, matching Story 3.1)
        file_content = await file.read()
        max_size = 10 * 1024 * 1024  # 10MB
        if len(file_content) > max_size:
            logger.warning(f"File too large: {len(file_content)} bytes")
            raise HTTPException(
                status_code=400,
                detail="File is too large. Maximum size is 10MB. Please compress your image.",
            )

        logger.info(
            f"Processing flyer upload: {file.filename} ({file.content_type}, {len(file_content)} bytes)"
        )

        # Story 3.2 AC: Call OpenAI Vision API (with 45-second timeout)
        result = await analyze_flyer(
            file_content=file_content, file_type=file.content_type, timeout=45.0
        )

        # Story 3.2 AC: Returns JSON
        return {"success": True, "data": result}

    except VisionAnalysisError as e:
        # Story 3.2 AC: Errors logged with fallback message
        logger.error(f"Vision analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

    except HTTPException:
        # Re-raise HTTP exceptions
        raise

    except Exception as e:
        # Story 3.2 AC: Errors logged with fallback message
        logger.error(f"Unexpected error in /api/analyze: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="AI extraction unavailable. Please enter event details manually.",
        )
