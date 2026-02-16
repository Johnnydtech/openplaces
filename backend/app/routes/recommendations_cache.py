"""
Story 2.11: Recommendation Caching Per User
Caches recommendation results to avoid redundant API calls.
Updated for TEXT user_id (Clerk IDs directly) and recommendations_cache table.
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
    Story 2.11 AC: Generate MD5 hash of event details for cache key

    Generates deterministic hash from event details for cache lookup.
    Normalizes event data to ensure consistent hashing.
    """
    # Normalize event data (sort keys, lowercase strings)
    normalized = {
        "name": event_data.get("name", "").lower().strip(),
        "date": event_data.get("date", "").strip(),
        "time": event_data.get("time", "").strip(),
        "venue_lat": round(event_data.get("venue_lat", 0), 4),
        "venue_lon": round(event_data.get("venue_lon", 0), 4),
        "target_audience": sorted(event_data.get("target_audience", [])),
        "event_type": event_data.get("event_type", "").lower().strip()
    }

    # Create hash from normalized JSON
    json_str = json.dumps(normalized, sort_keys=True)
    return hashlib.md5(json_str.encode()).hexdigest()


@router.post("/save")
async def save_recommendations_to_cache(
    request: CacheRequest,
    x_clerk_user_id: Optional[str] = Header(None, alias="X-Clerk-User-Id")
):
    """
    Story 2.11 AC: Save recommendations to cache

    Saves recommendation results to recommendations_cache table.
    Cache persists for 30 days (auto-set by database default).
    """
    if not x_clerk_user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    try:
        supabase = get_supabase_client()

        # Story 2.11 AC: Generate event hash for cache key
        event_hash = generate_event_hash(request.event_data)

        # Upsert cache entry (insert or update if exists)
        # The unique constraint on (user_id, event_hash) handles deduplication
        cache_entry = {
            "user_id": x_clerk_user_id,  # TEXT field with Clerk ID directly
            "event_hash": event_hash,
            "event_data": request.event_data,
            "zones": request.zones
            # expires_at auto-set to 30 days by database default
            # last_accessed_at auto-set to NOW() by database default
        }

        result = supabase.table("recommendations_cache")\
            .upsert(cache_entry, on_conflict="user_id,event_hash")\
            .execute()

        logger.info(f"Recommendations cached: event_hash={event_hash}, user={x_clerk_user_id}")

        return {
            "status": "success",
            "message": "Recommendations cached",
            "cache_id": result.data[0]["id"] if result.data else None,
            "event_hash": event_hash
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
    Cache persists 30 days, updates last_accessed_at on hit.
    """
    if not x_clerk_user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    try:
        supabase = get_supabase_client()

        # Generate event hash
        event_hash = generate_event_hash(request.event_data)

        # Story 2.11 AC: Check cache (same event hash returns cached instantly)
        result = supabase.table("recommendations_cache")\
            .select("*")\
            .eq("user_id", x_clerk_user_id)\
            .eq("event_hash", event_hash)\
            .gt("expires_at", datetime.utcnow().isoformat())\
            .execute()

        if not result.data:
            return {
                "status": "miss",
                "cached": False,
                "message": "No cached recommendations found"
            }

        cached_rec = result.data[0]

        # Update last_accessed_at for LRU tracking
        supabase.table("recommendations_cache")\
            .update({"last_accessed_at": datetime.utcnow().isoformat()})\
            .eq("id", cached_rec["id"])\
            .execute()

        # Calculate cache age
        created_at = datetime.fromisoformat(cached_rec["created_at"].replace("Z", "+00:00"))
        age_hours = (datetime.now(created_at.tzinfo) - created_at).total_seconds() / 3600

        logger.info(f"Cache hit: event_hash={event_hash}, user={x_clerk_user_id}, age={age_hours:.1f}h")

        # Cache hit
        return {
            "status": "hit",
            "cached": True,
            "message": "Cached recommendations found",
            "recommendations": {
                "event_data": cached_rec["event_data"],
                "zones": cached_rec["zones"],
                "cached_at": cached_rec["created_at"],
                "age_hours": round(age_hours, 1)
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
        raise HTTPException(status_code=401, detail="User not authenticated")

    try:
        supabase = get_supabase_client()

        result = supabase.table("recommendations_cache")\
            .delete()\
            .eq("user_id", x_clerk_user_id)\
            .eq("event_hash", event_hash)\
            .execute()

        logger.info(f"Cache cleared: event_hash={event_hash}, user={x_clerk_user_id}")

        return {
            "status": "success",
            "message": "Cache cleared - recommendations will be regenerated"
        }

    except Exception as e:
        logger.error(f"Error clearing cache: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/clear-all")
async def clear_all_user_cache(
    x_clerk_user_id: Optional[str] = Header(None, alias="X-Clerk-User-Id")
):
    """
    Clear all cached recommendations for the current user.
    Useful for testing or user-requested cache reset.
    """
    if not x_clerk_user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    try:
        supabase = get_supabase_client()

        result = supabase.table("recommendations_cache")\
            .delete()\
            .eq("user_id", x_clerk_user_id)\
            .execute()

        deleted_count = len(result.data) if result.data else 0

        logger.info(f"User cache cleared: user={x_clerk_user_id}, count={deleted_count}")

        return {
            "status": "success",
            "deleted_count": deleted_count,
            "message": f"Cleared {deleted_count} cached recommendations"
        }

    except Exception as e:
        logger.error(f"Error clearing user cache: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cleanup-expired")
async def cleanup_expired_cache():
    """
    Story 2.11 AC: Cache expires after 30 days

    Cleanup endpoint to delete expired cache entries.
    Should be called by a cron job or scheduled task.
    """
    try:
        supabase = get_supabase_client()

        # Delete expired cache entries (expires_at < now)
        result = supabase.table("recommendations_cache")\
            .delete()\
            .lt("expires_at", datetime.utcnow().isoformat())\
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
