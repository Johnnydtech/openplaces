"""
Story 2.6, 2.7, 2.8, 2.9: Saved Recommendations API
Updated to work with individual zone saves (not recommendation sets)
"""
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
import logging
from app.supabase_client import get_supabase_client

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/saved-recommendations", tags=["saved-recommendations"])


class SaveRecommendationRequest(BaseModel):
    """Request to save an individual zone recommendation"""
    user_id: str  # Clerk user ID
    zone_id: str
    zone_name: str
    event_name: str
    event_date: str
    notes: Optional[str] = None


class UpdateNotesRequest(BaseModel):
    """Request to update notes on a saved recommendation"""
    notes: str


@router.post("/save")
async def save_recommendation(
    request: SaveRecommendationRequest,
    x_clerk_user_id: Optional[str] = Header(None, alias="X-Clerk-User-Id")
):
    """
    Story 2.6 AC: "Save" button saves individual zone to saved_recommendations table

    Saves a specific zone recommendation to user's saved list.
    Requires authentication (Clerk user ID in header).
    """
    if not x_clerk_user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    if x_clerk_user_id != request.user_id:
        raise HTTPException(status_code=403, detail="User ID mismatch")

    try:
        supabase = get_supabase_client()

        # Get internal user_id from clerk_user_id
        user_result = supabase.table("users").select("id").eq("clerk_user_id", x_clerk_user_id).execute()

        if not user_result.data:
            logger.warning(f"User not found in database: clerk_user_id={x_clerk_user_id}")
            raise HTTPException(status_code=404, detail="User not found in database. Please sign in again or contact support.")

        internal_user_id = user_result.data[0]["id"]

        # Story 2.6 AC: Save zone to saved_recommendations table with optional notes
        result = supabase.table("saved_recommendations").insert({
            "user_id": internal_user_id,
            "zone_id": request.zone_id,
            "zone_name": request.zone_name,
            "event_name": request.event_name,
            "event_date": request.event_date,
            "notes": request.notes
        }).execute()

        logger.info(f"Zone saved: user={x_clerk_user_id}, zone={request.zone_id}, event={request.event_name}")

        return {
            "message": "Recommendation saved!",  # Story 2.6 AC: Success message
            "saved_recommendation_id": result.data[0]["id"] if result.data else None
        }

    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"Error saving recommendation: {str(e)}"
        logger.error(error_msg)
        # Check for duplicate constraint violation
        if "duplicate" in str(e).lower() or "unique" in str(e).lower():
            raise HTTPException(status_code=409, detail="Recommendation already saved")
        raise HTTPException(status_code=500, detail=error_msg)


@router.post("/unsave")
async def unsave_recommendation(
    request: SaveRecommendationRequest,
    x_clerk_user_id: Optional[str] = Header(None, alias="X-Clerk-User-Id")
):
    """
    Story 2.6 AC: Clicking "Saved" button removes the saved recommendation

    Removes a zone from user's saved list.
    """
    if not x_clerk_user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    if x_clerk_user_id != request.user_id:
        raise HTTPException(status_code=403, detail="User ID mismatch")

    try:
        supabase = get_supabase_client()

        # Get internal user_id
        user_result = supabase.table("users").select("id").eq("clerk_user_id", x_clerk_user_id).execute()

        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")

        internal_user_id = user_result.data[0]["id"]

        # Delete the saved recommendation
        result = supabase.table("saved_recommendations")\
            .delete()\
            .eq("user_id", internal_user_id)\
            .eq("zone_id", request.zone_id)\
            .execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Saved recommendation not found")

        logger.info(f"Zone unsaved: user={x_clerk_user_id}, zone={request.zone_id}")

        return {
            "message": "Recommendation removed"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error unsaving recommendation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{user_id}")
async def get_saved_recommendations(
    user_id: str,
    x_clerk_user_id: Optional[str] = Header(None, alias="X-Clerk-User-Id")
):
    """
    Story 2.7 AC: View all saved recommendations

    Returns list of saved zone recommendations for the authenticated user.
    Sorted by most recent (created_at DESC).
    Format matches frontend SavedRecommendation interface.
    """
    if not x_clerk_user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    if x_clerk_user_id != user_id:
        raise HTTPException(status_code=403, detail="User ID mismatch")

    try:
        supabase = get_supabase_client()

        # Get internal user_id
        user_result = supabase.table("users").select("id").eq("clerk_user_id", x_clerk_user_id).execute()

        if not user_result.data:
            return []

        internal_user_id = user_result.data[0]["id"]

        # Story 2.7 AC: List sorted by most recent
        result = supabase.table("saved_recommendations")\
            .select("*")\
            .eq("user_id", internal_user_id)\
            .order("created_at", desc=True)\
            .execute()

        # Transform to match frontend interface
        saved_recommendations = []
        for row in result.data:
            saved_recommendations.append({
                "id": row["id"],
                "user_id": user_id,  # Return Clerk user ID
                "zone_id": row["zone_id"],
                "zone_name": row["zone_name"],
                "event_name": row["event_name"],
                "event_date": row["event_date"],
                "notes": row["notes"],
                "created_at": row["created_at"]
            })

        return saved_recommendations

    except Exception as e:
        logger.error(f"Error listing saved recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{saved_recommendation_id}/notes")
async def update_notes(
    saved_recommendation_id: str,
    request: UpdateNotesRequest,
    x_clerk_user_id: Optional[str] = Header(None, alias="X-Clerk-User-Id")
):
    """
    Story 2.8 AC: Add/Edit notes on saved recommendations

    Updates notes for a saved zone recommendation.
    Only the owner can update their notes.
    """
    if not x_clerk_user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    try:
        supabase = get_supabase_client()

        # Get internal user_id
        user_result = supabase.table("users").select("id").eq("clerk_user_id", x_clerk_user_id).execute()

        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")

        internal_user_id = user_result.data[0]["id"]

        # Story 2.8 AC: Update notes (500 char limit enforced in frontend)
        result = supabase.table("saved_recommendations")\
            .update({"notes": request.notes})\
            .eq("id", saved_recommendation_id)\
            .eq("user_id", internal_user_id)\
            .execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Saved recommendation not found")

        logger.info(f"Notes updated: saved_recommendation_id={saved_recommendation_id}")

        return {
            "message": "Notes updated successfully"  # Story 2.8 AC: Success message
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating notes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{saved_recommendation_id}")
async def delete_saved_recommendation(
    saved_recommendation_id: str,
    x_clerk_user_id: Optional[str] = Header(None, alias="X-Clerk-User-Id")
):
    """
    Story 2.9 AC: Delete saved recommendation

    Deletes a saved zone recommendation from user's list.
    Only the owner can delete their saved recommendations.
    """
    if not x_clerk_user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    try:
        supabase = get_supabase_client()

        # Get internal user_id
        user_result = supabase.table("users").select("id").eq("clerk_user_id", x_clerk_user_id).execute()

        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")

        internal_user_id = user_result.data[0]["id"]

        # Story 2.9 AC: Delete from saved_recommendations table
        result = supabase.table("saved_recommendations")\
            .delete()\
            .eq("id", saved_recommendation_id)\
            .eq("user_id", internal_user_id)\
            .execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Saved recommendation not found")

        logger.info(f"Recommendation deleted: saved_recommendation_id={saved_recommendation_id}")

        return {
            "message": "Recommendation deleted successfully"  # Story 2.9 AC: Success message
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting saved recommendation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/check/{user_id}/{zone_id}")
async def check_if_saved(
    user_id: str,
    zone_id: str,
    x_clerk_user_id: Optional[str] = Header(None, alias="X-Clerk-User-Id")
):
    """
    Story 2.6 AC: Check if a zone is already saved by the user

    Used to show "Saved" state in UI (Button changes to "Saved").
    """
    if not x_clerk_user_id:
        return {"is_saved": False}

    if x_clerk_user_id != user_id:
        return {"is_saved": False}

    try:
        supabase = get_supabase_client()

        # Get internal user_id
        user_result = supabase.table("users").select("id").eq("clerk_user_id", x_clerk_user_id).execute()

        if not user_result.data:
            return {"is_saved": False}

        internal_user_id = user_result.data[0]["id"]

        # Check if zone is saved
        result = supabase.table("saved_recommendations")\
            .select("id")\
            .eq("user_id", internal_user_id)\
            .eq("zone_id", zone_id)\
            .execute()

        return {
            "is_saved": len(result.data) > 0
        }

    except Exception as e:
        logger.error(f"Error checking saved status: {str(e)}")
        return {"is_saved": False}
