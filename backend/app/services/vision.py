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
from google.cloud import vision
import io

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

# Initialize Google Cloud Vision client
def get_vision_client() -> vision.ImageAnnotatorClient:
    """Get or create Google Cloud Vision client"""
    # Google Cloud SDK will automatically use GOOGLE_APPLICATION_CREDENTIALS env var
    return vision.ImageAnnotatorClient()


class VisionAnalysisError(Exception):
    """Custom exception for vision analysis failures"""

    pass


async def analyze_flyer(
    file_content: bytes, file_type: str, timeout: float = 45.0
) -> Dict[str, Any]:
    """
    Analyze uploaded flyer using Google Cloud Vision OCR + OpenAI GPT-4

    Story 3.2 Acceptance Criteria:
    - Backend /api/analyze endpoint extracts text via Google Cloud Vision OCR
    - GPT-4 parses text to extract: name, date, time, venue, audience
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
        start_time = datetime.now()
        logger.info(f"Starting flyer analysis at {start_time.isoformat()}")

        # Check file type
        if file_type == "application/pdf":
            logger.warning("PDF upload detected - not supported")
            raise VisionAnalysisError(
                "PDF files are not supported. Please convert to JPG or PNG and try again."
            )
        elif file_type not in ["image/jpeg", "image/png"]:
            raise VisionAnalysisError(f"Unsupported file type: {file_type}")

        # Step 1: Use Google Cloud Vision API to extract text (OCR)
        logger.info("Extracting text using Google Cloud Vision API...")
        try:
            vision_client = get_vision_client()
            image = vision.Image(content=file_content)
            response = vision_client.text_detection(image=image)

            if response.error.message:
                raise VisionAnalysisError(f"Google Vision API error: {response.error.message}")

            texts = response.text_annotations
            if not texts:
                raise VisionAnalysisError("No text detected in the image. Please upload a clearer flyer.")

            # The first annotation contains all detected text
            extracted_text = texts[0].description
            logger.info(f"Extracted {len(extracted_text)} characters from image")

        except Exception as e:
            logger.error(f"Google Cloud Vision API error: {str(e)}")
            raise VisionAnalysisError(
                "Text extraction failed. Please ensure GOOGLE_APPLICATION_CREDENTIALS is set."
            )

        # Step 2: Use OpenAI GPT-4 to parse the extracted text
        logger.info("Parsing extracted text with GPT-4...")
        prompt = f"""You are analyzing text extracted from an event flyer. Parse the following text and extract event information in JSON format:

EXTRACTED TEXT:
{extracted_text}

Return ONLY a JSON object (no markdown, no explanation) with this structure:
{{
  "event_name": "Name of the event",
  "event_date": "Date of the event (convert to ISO format YYYY-MM-DD if possible, otherwise return as text)",
  "event_time": "Time of the event (e.g., '7:00 PM', '2-5 PM')",
  "venue": "Venue name and/or address",
  "target_audience": ["List", "of", "audience", "types"],
  "confidence": "High|Medium|Low",
  "extraction_notes": "Any warnings or missing information"
}}

Target audience should describe who would be interested in this event (e.g., "young professionals", "families", "students", "fitness enthusiasts", "foodies", "coffee enthusiasts").

If any information is unclear or missing, note it in extraction_notes and mark confidence as Medium or Low."""

        try:
            client = get_openai_client()
            response = await asyncio.wait_for(
                client.chat.completions.create(
                    model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                    messages=[
                        {
                            "role": "user",
                            "content": prompt,
                        }
                    ],
                    max_tokens=500,
                    temperature=0.2,
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
