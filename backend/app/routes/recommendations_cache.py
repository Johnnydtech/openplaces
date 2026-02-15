"""
Story 2.11: Recommendation Caching Per User

Caches recommendation results to avoid redundant API calls.
"""
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, List
import hashlib
import json
from datetime import datetime, timedelta
import logging
from app.supabase_client import get_supabase_client

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/recommendations-cache", tags=["recommendations-cache"])


class CacheRequest(BaseModel):
    """Request to save recommendations to cache"""
    event_data: dict
    zones: List[dict]


class CheckCacheRequest(BaseModel):
    """Request to check if cached recommendations exist"""
    event_data: dict


def generate_event_hash(event_data: dict) -> str:
    """
    Story 2.11 AC: event_hash (SHA-256 hash of event details)

    Generates SHA-256 hash of event details for cache lookup.
    Normalizes event data to ensure consistent hashing.
    """
    # Normalize event data (sort keys, remove timestamps)
    normalized = {
        "name": event_data.get("name", "").lower().strip(),
        "date": event_data.get("date", ""),
        "time": event_data.get("time", ""),
        "venue": event_data.get("venue", "").lower().strip(),
        "audience": sorted(event_data.get("audience", [])),
        "event_type": event_data.get("event_type", "").lower()
    }

    # Create hash from normalized JSON
    json_str = json.dumps(normalized, sort_keys=True)
    return hashlib.sha256(json_str.encode()).hexdigest()


@router.post("/save")
async def save_recommendations_to_cache(
    request: CacheRequest,
    x_clerk_user_id: Optional[str] = Header(None, alias="X-Clerk-User-Id")
):
    """
    Story 2.11 AC: Save recommendations to cache

    Saves recommendation results to recommendations table.
    Cache persists for 30 days.
    """
    if not x_clerk_user_id:
        # Allow caching for anonymous users (user_id = null)
        user_id = None
    else:
        # Get internal user_id for authenticated users
        supabase = get_supabase_client()
        user_result = supabase.table("users").select("id").eq("clerk_user_id", x_clerk_user_id).execute()

        if user_result.data:
            user_id = user_result.data[0]["id"]
        else:
            user_id = None

    try:
        supabase = get_supabase_client()

        # Story 2.11 AC: Generate event hash for cache key
        event_hash = generate_event_hash(request.event_data)

        # Check if cache already exists
        existing = supabase.table("recommendations")\
            .select("id")\
            .eq("event_hash", event_hash)

        if user_id:
            existing = existing.eq("user_id", user_id)
        else:
            existing = existing.is_("user_id", "null")

        existing_result = existing.execute()

        if existing_result.data:
            # Update existing cache
            result = supabase.table("recommendations")\
                .update({
                    "event_data": request.event_data,
                    "zones": request.zones,
                    "created_at": datetime.utcnow().isoformat()  # Refresh timestamp
                })\
                .eq("id", existing_result.data[0]["id"])\
                .execute()
        else:
            # Create new cache entry
            result = supabase.table("recommendations").insert({
                "user_id": user_id,
                "event_hash": event_hash,
                "event_data": request.event_data,
                "zones": request.zones
            }).execute()

        logger.info(f"Recommendations cached: event_hash={event_hash}, user_id={user_id}")

        return {
            "status": "success",
            "message": "Recommendations cached",
            "cache_id": result.data[0]["id"] if result.data else None
        }

    except Exception as e:
        logger.error(f"Error caching recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/check")
async def check_cache(
    request: CheckCacheRequest,
    x_clerk_user_id: Optional[str] = Header(None, alias="X-Clerk-User-Id")
):
    """
    Story 2.11 AC: Check cache and return if exists

    Returns cached recommendations if available and not expired.
    Cache persists 30 days.
    """
    if not x_clerk_user_id:
        user_id = None
    else:
        supabase = get_supabase_client()
        user_result = supabase.table("users").select("id").eq("clerk_user_id", x_clerk_user_id).execute()
        user_id = user_result.data[0]["id"] if user_result.data else None

    try:
        supabase = get_supabase_client()

        # Generate event hash
        event_hash = generate_event_hash(request.event_data)

        # Story 2.11 AC: Check cache (same event hash returns cached instantly)
        query = supabase.table("recommendations")\
            .select("*")\
            .eq("event_hash", event_hash)

        if user_id:
            query = query.eq("user_id", user_id)
        else:
            query = query.is_("user_id", "null")

        result = query.execute()

        if not result.data:
            return {
                "status": "miss",
                "cached": False,
                "message": "No cached recommendations found"
            }

        cached_rec = result.data[0]

        # Story 2.11 AC: Cache persists 30 days
        created_at = datetime.fromisoformat(cached_rec["created_at"].replace("Z", "+00:00"))
        age_days = (datetime.now(created_at.tzinfo) - created_at).days

        if age_days > 30:
            # Cache expired
            return {
                "status": "expired",
                "cached": False,
                "message": "Cache expired (>30 days)",
                "age_days": age_days
            }

        # Cache hit
        return {
            "status": "hit",
            "cached": True,
            "message": "Cached recommendations found",
            "recommendations": {
                "event_data": cached_rec["event_data"],
                "zones": cached_rec["zones"],
                "cached_at": cached_rec["created_at"],
                "age_days": age_days
            }
        }

    except Exception as e:
        logger.error(f"Error checking cache: {str(e)}")
        return {
            "status": "error",
            "cached": False,
            "message": str(e)
        }


@router.delete("/clear/{event_hash}")
async def clear_cache(
    event_hash: str,
    x_clerk_user_id: Optional[str] = Header(None, alias="X-Clerk-User-Id")
):
    """
    Story 2.11 AC: "Regenerate Recommendations" forces refresh

    Clears cached recommendations to force regeneration.
    """
    if not x_clerk_user_id:
        user_id = None
    else:
        supabase = get_supabase_client()
        user_result = supabase.table("users").select("id").eq("clerk_user_id", x_clerk_user_id).execute()
        user_id = user_result.data[0]["id"] if user_result.data else None

    try:
        supabase = get_supabase_client()

        query = supabase.table("recommendations")\
            .delete()\
            .eq("event_hash", event_hash)

        if user_id:
            query = query.eq("user_id", user_id)
        else:
            query = query.is_("user_id", "null")

        result = query.execute()

        logger.info(f"Cache cleared: event_hash={event_hash}, user_id={user_id}")

        return {
            "status": "success",
            "message": "Cache cleared - recommendations will be regenerated"
        }

    except Exception as e:
        logger.error(f"Error clearing cache: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cleanup-expired")
async def cleanup_expired_cache():
    """
    Cleanup endpoint to delete cache entries older than 30 days.
    Should be called by a cron job or scheduled task.
    """
    try:
        supabase = get_supabase_client()

        # Calculate cutoff date (30 days ago)
        cutoff_date = (datetime.utcnow() - timedelta(days=30)).isoformat()

        # Delete expired cache entries
        result = supabase.table("recommendations")\
            .delete()\
            .lt("created_at", cutoff_date)\
            .execute()

        deleted_count = len(result.data) if result.data else 0

        logger.info(f"Cache cleanup completed: {deleted_count} expired entries deleted")

        return {
            "status": "success",
            "deleted_count": deleted_count,
            "message": f"Cleaned up {deleted_count} expired cache entries"
        }

    except Exception as e:
        logger.error(f"Error during cache cleanup: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
