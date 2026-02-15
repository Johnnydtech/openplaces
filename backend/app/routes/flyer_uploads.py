"""
Story 2.10: Flyer Upload Persistence with User Linking

Handles flyer uploads to Supabase Storage and tracking in database.
"""
from fastapi import APIRouter, HTTPException, Header, UploadFile, File
from typing import Optional
from datetime import datetime, timedelta
import logging
import uuid
from app.supabase_client import get_supabase_client

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/flyer-uploads", tags=["flyer-uploads"])


@router.post("/upload")
async def upload_flyer(
    file: UploadFile = File(...),
    event_data: Optional[str] = None,
    x_clerk_user_id: Optional[str] = Header(None, alias="X-Clerk-User-Id")
):
    """
    Story 2.10 AC: Flyer stored in Supabase Storage with record in flyer_uploads table

    Uploads flyer image to Supabase Storage and creates tracking record.
    Only authenticated users can upload.
    Files auto-expire after 7 days.
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

        # Generate unique filename
        file_extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        unique_filename = f"{user_id}/{uuid.uuid4()}.{file_extension}"

        # Read file content
        file_content = await file.read()

        # Story 2.10 AC: Upload to Supabase Storage
        storage_result = supabase.storage.from_("flyer-uploads").upload(
            unique_filename,
            file_content,
            file_options={"content-type": file.content_type}
        )

        # Get public URL
        public_url = supabase.storage.from_("flyer-uploads").get_public_url(unique_filename)

        # Story 2.10 AC: Create record in flyer_uploads table with expires_at (7 days)
        expires_at = datetime.utcnow() + timedelta(days=7)

        import json
        event_data_json = json.loads(event_data) if event_data else {}

        upload_record = supabase.table("flyer_uploads").insert({
            "user_id": user_id,
            "storage_path": unique_filename,
            "event_data": event_data_json,
            "expires_at": expires_at.isoformat()
        }).execute()

        logger.info(f"Flyer uploaded: user_id={user_id}, path={unique_filename}")

        return {
            "status": "success",
            "message": "Flyer uploaded successfully",
            "upload": {
                "id": upload_record.data[0]["id"] if upload_record.data else None,
                "storage_path": unique_filename,
                "public_url": public_url,
                "expires_at": expires_at.isoformat()
            }
        }

    except Exception as e:
        logger.error(f"Error uploading flyer: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_upload_history(
    x_clerk_user_id: Optional[str] = Header(None, alias="X-Clerk-User-Id")
):
    """
    Story 2.10 AC: View at /upload-history

    Returns user's flyer upload history, sorted by most recent.
    Only shows uploads that haven't expired yet.
    """
    if not x_clerk_user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    try:
        supabase = get_supabase_client()

        # Get internal user_id
        user_result = supabase.table("users").select("id").eq("clerk_user_id", x_clerk_user_id).execute()

        if not user_result.data:
            return {"uploads": []}

        user_id = user_result.data[0]["id"]

        # Get user's uploads (not expired)
        now = datetime.utcnow().isoformat()
        result = supabase.table("flyer_uploads")\
            .select("*")\
            .eq("user_id", user_id)\
            .gte("expires_at", now)\
            .order("created_at", desc=True)\
            .execute()

        # Add public URLs to uploads
        uploads_with_urls = []
        for upload in result.data:
            public_url = supabase.storage.from_("flyer-uploads").get_public_url(upload["storage_path"])
            upload["public_url"] = public_url
            uploads_with_urls.append(upload)

        return {
            "uploads": uploads_with_urls,
            "count": len(uploads_with_urls)
        }

    except Exception as e:
        logger.error(f"Error fetching upload history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{upload_id}")
async def delete_flyer_upload(
    upload_id: str,
    x_clerk_user_id: Optional[str] = Header(None, alias="X-Clerk-User-Id")
):
    """
    Delete a flyer upload (removes from storage and database).
    Only the owner can delete their uploads.
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

        # Get upload record
        upload_result = supabase.table("flyer_uploads")\
            .select("*")\
            .eq("id", upload_id)\
            .eq("user_id", user_id)\
            .execute()

        if not upload_result.data:
            raise HTTPException(status_code=404, detail="Upload not found")

        upload = upload_result.data[0]

        # Delete from storage
        try:
            supabase.storage.from_("flyer-uploads").remove([upload["storage_path"]])
        except Exception as storage_error:
            logger.warning(f"Storage deletion failed: {str(storage_error)}")

        # Delete from database
        supabase.table("flyer_uploads").delete().eq("id", upload_id).execute()

        logger.info(f"Flyer deleted: upload_id={upload_id}")

        return {
            "status": "success",
            "message": "Upload deleted successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting upload: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cleanup-expired")
async def cleanup_expired_uploads():
    """
    Story 2.10 AC: Auto-deleted after 7 days

    Cleanup endpoint to delete expired flyer uploads.
    Should be called by a cron job or scheduled task.
    """
    try:
        supabase = get_supabase_client()

        # Find expired uploads
        now = datetime.utcnow().isoformat()
        expired_result = supabase.table("flyer_uploads")\
            .select("*")\
            .lt("expires_at", now)\
            .execute()

        deleted_count = 0
        for upload in expired_result.data:
            try:
                # Delete from storage
                supabase.storage.from_("flyer-uploads").remove([upload["storage_path"]])

                # Delete from database
                supabase.table("flyer_uploads").delete().eq("id", upload["id"]).execute()

                deleted_count += 1
            except Exception as e:
                logger.warning(f"Failed to delete expired upload {upload['id']}: {str(e)}")

        logger.info(f"Cleanup completed: {deleted_count} expired uploads deleted")

        return {
            "status": "success",
            "deleted_count": deleted_count,
            "message": f"Cleaned up {deleted_count} expired uploads"
        }

    except Exception as e:
        logger.error(f"Error during cleanup: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
