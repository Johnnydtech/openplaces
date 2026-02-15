"""
Story 2.6, 2.7, 2.8, 2.9: Saved Recommendations API
"""
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
import logging
from app.supabase_client import get_supabase_client

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/saved-recommendations", tags=["saved-recommendations"])


class SaveRecommendationRequest(BaseModel):
    """Request to save a recommendation"""
    recommendation_id: str
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
    Story 2.6 AC: "Save" button saves to saved_recommendations table

    Saves a recommendation to user's saved list.
    Requires authentication (Clerk user ID in header).
    """
    if not x_clerk_user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    try:
        supabase = get_supabase_client()

        # Get internal user_id from clerk_user_id
        user_result = supabase.table("users").select("id").eq("clerk_user_id", x_clerk_user_id).execute()

        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found in database")

        user_id = user_result.data[0]["id"]

        # Story 2.6 AC: Save to saved_recommendations table with optional notes
        result = supabase.table("saved_recommendations").insert({
            "user_id": user_id,
            "recommendation_id": request.recommendation_id,
            "notes": request.notes
        }).execute()

        logger.info(f"Recommendation saved: user_id={user_id}, recommendation_id={request.recommendation_id}")

        return {
            "status": "success",
            "message": "Recommendation saved!",  # Story 2.6 AC: Success message
            "saved_recommendation": result.data[0] if result.data else None
        }

    except Exception as e:
        logger.error(f"Error saving recommendation: {str(e)}")
        # Check for duplicate constraint violation
        if "duplicate" in str(e).lower() or "unique" in str(e).lower():
            return {
                "status": "already_saved",
                "message": "Recommendation already saved"
            }
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list")
async def list_saved_recommendations(
    x_clerk_user_id: Optional[str] = Header(None, alias="X-Clerk-User-Id")
):
    """
    Story 2.7 AC: View all saved recommendations

    Returns list of saved recommendations for the authenticated user.
    Sorted by most recent (created_at DESC).
    """
    if not x_clerk_user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    try:
        supabase = get_supabase_client()

        # Get internal user_id
        user_result = supabase.table("users").select("id").eq("clerk_user_id", x_clerk_user_id).execute()

        if not user_result.data:
            return {"saved_recommendations": []}

        user_id = user_result.data[0]["id"]

        # Story 2.7 AC: List sorted by most recent
        result = supabase.table("saved_recommendations")\
            .select("*, recommendations(*)")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True)\
            .execute()

        return {
            "saved_recommendations": result.data,
            "count": len(result.data)
        }

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

    Updates notes for a saved recommendation.
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

        user_id = user_result.data[0]["id"]

        # Story 2.8 AC: Update notes (500 char limit enforced in frontend)
        result = supabase.table("saved_recommendations")\
            .update({"notes": request.notes})\
            .eq("id", saved_recommendation_id)\
            .eq("user_id", user_id)\
            .execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Saved recommendation not found")

        logger.info(f"Notes updated: saved_recommendation_id={saved_recommendation_id}")

        return {
            "status": "success",
            "message": "Note saved!",  # Story 2.8 AC: Success message
            "saved_recommendation": result.data[0]
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

    Deletes a saved recommendation from user's list.
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

        user_id = user_result.data[0]["id"]

        # Story 2.9 AC: Delete from saved_recommendations table
        result = supabase.table("saved_recommendations")\
            .delete()\
            .eq("id", saved_recommendation_id)\
            .eq("user_id", user_id)\
            .execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Saved recommendation not found")

        logger.info(f"Recommendation deleted: saved_recommendation_id={saved_recommendation_id}")

        return {
            "status": "success",
            "message": "Recommendation deleted"  # Story 2.9 AC: Success message
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting saved recommendation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/check/{recommendation_id}")
async def check_if_saved(
    recommendation_id: str,
    x_clerk_user_id: Optional[str] = Header(None, alias="X-Clerk-User-Id")
):
    """
    Check if a recommendation is already saved by the user.

    Used to show "Saved" state in UI (Story 2.6 AC: Button changes to "Saved").
    """
    if not x_clerk_user_id:
        return {"is_saved": False}

    try:
        supabase = get_supabase_client()

        # Get internal user_id
        user_result = supabase.table("users").select("id").eq("clerk_user_id", x_clerk_user_id).execute()

        if not user_result.data:
            return {"is_saved": False}

        user_id = user_result.data[0]["id"]

        # Check if saved
        result = supabase.table("saved_recommendations")\
            .select("id")\
            .eq("user_id", user_id)\
            .eq("recommendation_id", recommendation_id)\
            .execute()

        return {
            "is_saved": len(result.data) > 0,
            "saved_recommendation_id": result.data[0]["id"] if result.data else None
        }

    except Exception as e:
        logger.error(f"Error checking saved status: {str(e)}")
        return {"is_saved": False}
