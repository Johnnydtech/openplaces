"""
Story 3.2: OpenAI Vision API Integration - /api/analyze endpoint
Receives uploaded flyers and returns extracted event details
UPDATED: Added abuse prevention (rate limiting, content moderation, usage tracking)
"""

import logging
from fastapi import APIRouter, File, UploadFile, HTTPException, Header
from fastapi.responses import JSONResponse
from typing import Optional
from app.services.vision import analyze_flyer, VisionAnalysisError
from app.services.content_moderator import content_moderator
from app.services.usage_tracker import usage_tracker, USAGE_LIMITS

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["analyze"])


@router.post("/analyze")
async def analyze_flyer_endpoint(
    file: UploadFile = File(...),
    x_clerk_user_id: Optional[str] = Header(None, alias="x-clerk-user-id")
):
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
        # 🔒 ABUSE PREVENTION 1: Require authentication for expensive AI operations
        if not x_clerk_user_id:
            raise HTTPException(
                status_code=401,
                detail="Authentication required. Please sign in to analyze flyers."
            )

        # 🔒 ABUSE PREVENTION 2: Check daily usage limit
        under_limit, usage_count = await usage_tracker.check_daily_limit(
            x_clerk_user_id,
            "analyze",
            USAGE_LIMITS["analyze"]
        )

        if not under_limit:
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "Daily limit exceeded",
                    "message": f"You've reached your daily limit of {USAGE_LIMITS['analyze']} AI analyses. "
                               f"Please try again tomorrow or upgrade to a paid plan.",
                    "usage": usage_count,
                    "limit": USAGE_LIMITS["analyze"]
                }
            )

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

        # 🔒 ABUSE PREVENTION 3: Content moderation (check for inappropriate images)
        is_safe, moderation_result = await content_moderator.moderate_image(file_content)

        if not is_safe:
            logger.warning(
                f"Inappropriate content detected for user {x_clerk_user_id}: "
                f"{moderation_result.get('reason', 'No reason provided')}"
            )
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Content policy violation",
                    "message": "This image contains inappropriate content and cannot be processed.",
                    "reason": moderation_result.get("reason", "Content flagged by moderation system"),
                    "categories": moderation_result.get("flagged_categories", [])
                }
            )

        logger.info(
            f"Processing flyer upload: {file.filename} ({file.content_type}, {len(file_content)} bytes) "
            f"for user {x_clerk_user_id}"
        )

        # Story 3.2 AC: Call OpenAI Vision API (with 45-second timeout)
        result = await analyze_flyer(
            file_content=file_content, file_type=file.content_type, timeout=45.0
        )

        # 🔒 ABUSE PREVENTION 4: Log usage for tracking and cost monitoring
        # Estimate API cost (GPT-4 Vision ~$0.01 per request)
        await usage_tracker.log_usage(
            user_id=x_clerk_user_id,
            operation_type="analyze",
            cost_estimate=0.01,
            metadata={
                "file_size_bytes": len(file_content),
                "file_type": file.content_type,
                "confidence": result.get("confidence", "unknown")
            }
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
