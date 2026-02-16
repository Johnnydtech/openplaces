"""
Content Moderation Service
Use OpenAI Moderation API to flag inappropriate content in uploaded images
"""

import logging
import base64
from typing import Dict, Any, Tuple
import openai
import os

logger = logging.getLogger(__name__)


class ContentModerator:
    """Moderate uploaded content using OpenAI Moderation API"""

    def __init__(self):
        self.client = openai.AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    async def moderate_image(self, image_content: bytes) -> Tuple[bool, Dict[str, Any]]:
        """
        Moderate image content for inappropriate material

        Args:
            image_content: Raw image bytes

        Returns:
            (is_safe: bool, moderation_result: dict)
        """
        try:
            # Convert image to base64
            base64_image = base64.b64encode(image_content).decode("utf-8")
            data_uri = f"data:image/jpeg;base64,{base64_image}"

            # Use GPT-4 Vision for content moderation
            # OpenAI's dedicated moderation API doesn't support images yet,
            # so we use Vision API with a moderation prompt
            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a content moderation AI. Analyze this image and determine if it contains:\n"
                            "- Explicit sexual content\n"
                            "- Violence or gore\n"
                            "- Hate symbols or extremist content\n"
                            "- Illegal activities\n"
                            "- Spam or scam content\n\n"
                            "Respond with JSON: {\"safe\": true/false, \"reason\": \"brief explanation\", "
                            "\"categories\": [\"list of flagged categories\"]}"
                        )
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Analyze this image for inappropriate content:"
                            },
                            {
                                "type": "image_url",
                                "image_url": {"url": data_uri}
                            }
                        ]
                    }
                ],
                max_tokens=200,
                temperature=0.0
            )

            # Parse response
            result_text = response.choices[0].message.content

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
        Moderate text content using OpenAI Moderation API

        Args:
            text: Text to moderate

        Returns:
            (is_safe: bool, moderation_result: dict)
        """
        try:
            # Use OpenAI's dedicated moderation endpoint for text
            response = await self.client.moderations.create(input=text)

            result = response.results[0]
            is_safe = not result.flagged

            moderation_result = {
                "is_safe": is_safe,
                "flagged": result.flagged,
                "categories": {
                    category: score
                    for category, score in result.category_scores.model_dump().items()
                    if score > 0.5  # Only include high-confidence flags
                },
                "category_scores": result.category_scores.model_dump()
            }

            if result.flagged:
                flagged_cats = [
                    cat for cat, flagged in result.categories.model_dump().items()
                    if flagged
                ]
                logger.warning(f"Text content flagged: {flagged_cats}")

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
