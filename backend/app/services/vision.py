"""
Story 3.2: OpenAI Vision API Integration for Event Extraction
Analyzes uploaded flyers with OpenAI Vision API to extract event details
"""

import os
import base64
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from openai import AsyncOpenAI
import httpx
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize OpenAI client (lazy loaded after env vars are available)
def get_openai_client() -> AsyncOpenAI:
    """Get or create OpenAI client"""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable is not set")
    return AsyncOpenAI(api_key=api_key)


class VisionAnalysisError(Exception):
    """Custom exception for vision analysis failures"""

    pass


async def analyze_flyer(
    file_content: bytes, file_type: str, timeout: float = 45.0
) -> Dict[str, Any]:
    """
    Analyze uploaded flyer with OpenAI Vision API to extract event details

    Story 3.2 Acceptance Criteria:
    - Backend /api/analyze endpoint calls OpenAI Vision API
    - GPT-4 Vision extracts: name, date, time, venue, audience
    - Response within 45 seconds (timeout)
    - Returns JSON
    - Errors logged with fallback message
    - API costs logged

    Args:
        file_content: Raw bytes of the uploaded file
        file_type: MIME type (e.g., 'image/jpeg', 'image/png', 'application/pdf')
        timeout: Maximum time to wait for API response (default 45 seconds)

    Returns:
        Dict containing:
            - event_name: str
            - event_date: str (ISO format or extracted text)
            - event_time: str
            - venue: str (name and/or address)
            - target_audience: list[str]
            - confidence: str ('High', 'Medium', 'Low')
            - extraction_notes: str (any warnings or additional context)

    Raises:
        VisionAnalysisError: If API call fails or times out
    """
    try:
        # Story 3.2 AC: Log API costs
        start_time = datetime.now()
        logger.info(f"Starting flyer analysis at {start_time.isoformat()}")

        # Convert file to base64 for OpenAI API
        base64_image = base64.b64encode(file_content).decode("utf-8")

        # Determine image format from MIME type
        if file_type == "image/jpeg":
            image_format = "jpeg"
        elif file_type == "image/png":
            image_format = "png"
        elif file_type == "application/pdf":
            # Note: OpenAI Vision doesn't directly support PDFs
            # For MVP, we'll return an error message
            logger.warning("PDF upload detected - not supported by Vision API")
            raise VisionAnalysisError(
                "PDF files are not supported. Please convert to JPG or PNG and try again."
            )
        else:
            raise VisionAnalysisError(f"Unsupported file type: {file_type}")

        # Story 3.2 AC: GPT-4 Vision extracts event details
        prompt = """Analyze this event flyer and extract the following information in JSON format:

{
  "event_name": "Name of the event",
  "event_date": "Date of the event (convert to ISO format YYYY-MM-DD if possible, otherwise return as text)",
  "event_time": "Time of the event (e.g., '7:00 PM', '2-5 PM')",
  "venue": "Venue name and/or address",
  "target_audience": ["List", "of", "audience", "types"],
  "confidence": "High|Medium|Low",
  "extraction_notes": "Any warnings or missing information"
}

Target audience should describe who would be interested in this event (e.g., "young professionals", "families", "students", "fitness enthusiasts", "foodies", "coffee enthusiasts").

If any information is unclear or missing, note it in extraction_notes and mark confidence as Medium or Low."""

        # Story 3.2 AC: Response within 45 seconds (timeout)
        try:
            client = get_openai_client()
            response = await asyncio.wait_for(
                client.chat.completions.create(
                    model=os.getenv("OPENAI_MODEL", "gpt-4-vision-preview"),
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": prompt},
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/{image_format};base64,{base64_image}"
                                    },
                                },
                            ],
                        }
                    ],
                    max_tokens=500,
                    temperature=0.2,  # Lower temperature for more consistent extraction
                ),
                timeout=timeout,
            )
        except asyncio.TimeoutError:
            logger.error(f"OpenAI API call timed out after {timeout} seconds")
            raise VisionAnalysisError(
                "AI extraction timed out. Please try again or enter event details manually."
            )

        # Extract response text
        content = response.choices[0].message.content
        if not content:
            raise VisionAnalysisError("No response from AI extraction")

        # Parse JSON response
        import json

        try:
            # Try to find JSON in the response (GPT sometimes adds explanation before/after)
            json_start = content.find("{")
            json_end = content.rfind("}") + 1
            if json_start >= 0 and json_end > json_start:
                json_str = content[json_start:json_end]
                result = json.loads(json_str)
            else:
                raise ValueError("No JSON found in response")

            # Validate required fields
            required_fields = [
                "event_name",
                "event_date",
                "event_time",
                "venue",
                "target_audience",
            ]
            for field in required_fields:
                if field not in result:
                    result[field] = (
                        "" if field != "target_audience" else []
                    )  # Provide defaults

            # Ensure confidence is set
            if "confidence" not in result or result["confidence"] not in [
                "High",
                "Medium",
                "Low",
            ]:
                result["confidence"] = "Medium"

            # Ensure extraction_notes is set
            if "extraction_notes" not in result:
                result["extraction_notes"] = ""

        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"Failed to parse AI response as JSON: {content[:200]}")
            raise VisionAnalysisError(
                "AI extraction returned invalid data. Please enter event details manually."
            )

        # Story 3.2 AC: API costs logged
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        tokens_used = response.usage.total_tokens if response.usage else 0
        logger.info(
            f"Flyer analysis complete in {duration:.2f}s using {tokens_used} tokens"
        )
        logger.info(f"Estimated cost: ${(tokens_used * 0.00003):.4f}")  # Rough estimate

        return result

    except VisionAnalysisError:
        # Re-raise our custom errors
        raise
    except httpx.TimeoutException:
        # Story 3.2 AC: Errors logged with fallback message
        logger.error("HTTP timeout during OpenAI API call")
        raise VisionAnalysisError(
            "Connection timed out. Please check your network and try again."
        )
    except Exception as e:
        # Story 3.2 AC: Errors logged with fallback message
        logger.error(f"Unexpected error during flyer analysis: {str(e)}")
        raise VisionAnalysisError(
            "AI extraction unavailable. Please enter event details manually."
        )


# Import asyncio for timeout handling
import asyncio
