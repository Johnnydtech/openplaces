"""
Content Moderation Service
Use Claude Opus 4.6 Vision API to flag inappropriate content in uploaded images
"""

import logging
import base64
from typing import Dict, Any, Tuple
import anthropic
import os

logger = logging.getLogger(__name__)


class ContentModerator:
    """Moderate uploaded content using Claude Opus 4.6"""

    def __init__(self):
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable is not set")
        self.client = anthropic.AsyncAnthropic(api_key=api_key)

    async def moderate_image(self, image_content: bytes) -> Tuple[bool, Dict[str, Any]]:
        """
        Moderate image content for inappropriate material using Claude Opus 4.6

        Args:
            image_content: Raw image bytes

        Returns:
            (is_safe: bool, moderation_result: dict)
        """
        try:
            # Convert image to base64 for Claude
            base64_image = base64.b64encode(image_content).decode("utf-8")

            # Use Claude Opus 4.6 Vision for content moderation
            prompt = """Analyze this image and determine if it contains inappropriate content:
- Explicit sexual content
- Violence or gore
- Hate symbols or extremist content
- Illegal activities
- Spam or scam content

Respond with ONLY a JSON object (no markdown, no explanation):
{"safe": true/false, "reason": "brief explanation", "categories": ["list of flagged categories"]}"""

            response = await self.client.messages.create(
                model="claude-opus-4-6",  # Claude Opus 4.6
                max_tokens=200,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": "image/jpeg",
                                    "data": base64_image,
                                },
                            },
                            {"type": "text", "text": prompt}
                        ],
                    }
                ],
            )

            # Parse response
            result_text = response.content[0].text if response.content else ""

            # Try to parse as JSON
            import json
            try:
                result = json.loads(result_text)
                is_safe = result.get("safe", True)
                reason = result.get("reason", "")
                categories = result.get("categories", [])
            except json.JSONDecodeError:
                # Fallback: simple keyword detection
                is_safe = "safe" in result_text.lower() and "not" not in result_text.lower()
                reason = result_text
                categories = []

            moderation_result = {
                "is_safe": is_safe,
                "reason": reason,
                "flagged_categories": categories,
                "raw_response": result_text
            }

            if not is_safe:
                logger.warning(f"Content flagged as unsafe: {reason}")

            return is_safe, moderation_result

        except Exception as e:
            logger.error(f"Content moderation failed: {str(e)}")
            # Fail open: allow content if moderation fails (don't block users)
            return True, {
                "is_safe": True,
                "reason": f"Moderation service unavailable: {str(e)}",
                "flagged_categories": [],
                "error": str(e)
            }

    async def moderate_text(self, text: str) -> Tuple[bool, Dict[str, Any]]:
        """
        Moderate text content using Claude Opus 4.6

        Args:
            text: Text to moderate

        Returns:
            (is_safe: bool, moderation_result: dict)
        """
        try:
            # Use Claude for text moderation
            prompt = f"""Analyze this text and determine if it contains inappropriate content:
- Hate speech or discrimination
- Explicit sexual content
- Violence or threats
- Illegal activities
- Spam or scam content
- Self-harm content

Text to analyze: "{text}"

Respond with ONLY a JSON object (no markdown, no explanation):
{{"safe": true/false, "reason": "brief explanation", "categories": ["list of flagged categories"]}}"""

            response = await self.client.messages.create(
                model="claude-opus-4-6",  # Claude Opus 4.6
                max_tokens=200,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
            )

            # Parse response
            result_text = response.content[0].text if response.content else ""

            # Try to parse as JSON
            import json
            try:
                # Find JSON in response
                json_start = result_text.find("{")
                json_end = result_text.rfind("}") + 1
                if json_start >= 0 and json_end > json_start:
                    json_str = result_text[json_start:json_end]
                    result = json.loads(json_str)
                else:
                    raise ValueError("No JSON found in response")

                is_safe = result.get("safe", True)
                reason = result.get("reason", "")
                categories = result.get("categories", [])
            except (json.JSONDecodeError, ValueError):
                # Fallback: simple keyword detection
                is_safe = "safe" in result_text.lower()
                reason = result_text
                categories = []

            moderation_result = {
                "is_safe": is_safe,
                "reason": reason,
                "flagged_categories": categories,
                "raw_response": result_text
            }

            if not is_safe:
                logger.warning(f"Text content flagged: {categories}")

            return is_safe, moderation_result

        except Exception as e:
            logger.error(f"Text moderation failed: {str(e)}")
            # Fail open
            return True, {
                "is_safe": True,
                "reason": f"Moderation service unavailable: {str(e)}",
                "error": str(e)
            }


# Global content moderator instance
content_moderator = ContentModerator()
