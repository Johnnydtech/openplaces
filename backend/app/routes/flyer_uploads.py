"""
Story 2.10: Flyer Upload Persistence with User Linking
Handles flyer uploads to Supabase Storage and tracking in database.
Updated for TEXT user_id (Clerk IDs directly)
"""
from fastapi import APIRouter, HTTPException, Header, UploadFile, File
from typing import Optional
from datetime import datetime, timedelta
import logging
import uuid
from app.supabase_client import get_supabase_client
from app.services.vision import analyze_flyer

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/flyer-uploads", tags=["flyer-uploads"])

ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/jpg", "application/pdf"]
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/upload")
async def upload_flyer(
    file: UploadFile = File(...),
    x_clerk_user_id: Optional[str] = Header(None, alias="X-Clerk-User-Id")
):
    """
    Story 2.10 AC: Upload flyer, store in Supabase Storage, extract event details

    Uploads flyer to Storage and creates record in flyer_uploads table.
    Extracts event details using OpenAI Vision API.
    Files auto-expire after 7 days.
    """
    if not x_clerk_user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    # Validate file type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"File type {file.content_type} not supported. Upload JPG, PNG, or PDF."
        )

    # Read file content
    file_content = await file.read()

    # Validate file size
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")

    try:
        supabase = get_supabase_client()

        # Generate unique filename (user_id/uuid.ext)
        file_extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        storage_path = f"{x_clerk_user_id}/{unique_filename}"

        # Story 2.10 AC: Upload to Supabase Storage bucket 'flyers'
        storage_result = supabase.storage.from_("flyers").upload(
            storage_path,
            file_content,
            file_options={"content-type": file.content_type}
        )

        if hasattr(storage_result, 'error') and storage_result.error:
            logger.error(f"Storage upload error: {storage_result.error}")
            raise HTTPException(status_code=500, detail="Failed to upload file to storage")

        # Extract event details using Google Vision OCR + GPT-4
        try:
            event_data = await analyze_flyer(file_content, file.content_type)
            # Normalize field names for consistency
            event_data = {
                "name": event_data.get("event_name", "Untitled Event"),
                "date": event_data.get("event_date", ""),
                "time": event_data.get("event_time", ""),
                "venue": event_data.get("venue", ""),
                "target_audience": event_data.get("target_audience", []),
                "event_type": event_data.get("event_type", "community event")
            }
        except Exception as e:
            logger.warning(f"Event extraction failed: {e}")
            event_data = {
                "name": "Untitled Event",
                "date": "",
                "time": "",
                "venue": "",
                "target_audience": [],
                "event_type": "community event"
            }

        # Story 2.10 AC: Create record in flyer_uploads table with 7-day expiration
        expires_at = datetime.utcnow() + timedelta(days=7)

        upload_record = supabase.table("flyer_uploads").insert({
            "user_id": x_clerk_user_id,  # TEXT field with Clerk ID directly
            "storage_path": storage_path,
            "file_name": file.filename,
            "file_size": len(file_content),
            "mime_type": file.content_type,
            "event_data": event_data,
            "expires_at": expires_at.isoformat()
        }).execute()

        if not upload_record.data:
            raise HTTPException(status_code=500, detail="Failed to create flyer record")

        logger.info(f"Flyer uploaded: user={x_clerk_user_id}, flyer_id={upload_record.data[0]['id']}")

        return {
            "status": "success",
            "message": "Flyer uploaded successfully",
            "flyer_id": upload_record.data[0]["id"],
            "storage_path": storage_path,
            "event_data": event_data,
            "expires_at": expires_at.isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading flyer: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_upload_history(
    x_clerk_user_id: Optional[str] = Header(None, alias="X-Clerk-User-Id")
):
    """
    Story 2.10 AC: View upload history at /upload-history

    Returns user's flyer upload history with signed URLs.
    Only shows non-expired uploads, sorted by most recent.
    """
    if not x_clerk_user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    try:
        supabase = get_supabase_client()

        # Get user's non-expired uploads
        now = datetime.utcnow().isoformat()
        result = supabase.table("flyer_uploads")\
            .select("*")\
            .eq("user_id", x_clerk_user_id)\
            .gte("expires_at", now)\
            .order("created_at", desc=True)\
            .execute()

        # Add signed URLs for secure access
        uploads_with_urls = []
        for upload in result.data:
            try:
                signed_url_response = supabase.storage.from_("flyers").create_signed_url(
                    path=upload["storage_path"],
                    expires_in=3600  # 1 hour
                )
                signed_url = signed_url_response.get("signedURL") if signed_url_response else None
            except Exception as e:
                logger.warning(f"Failed to generate signed URL for {upload['storage_path']}: {e}")
                signed_url = None

            uploads_with_urls.append({
                "id": upload["id"],
                "storage_path": upload["storage_path"],
                "file_name": upload["file_name"],
                "event_data": upload["event_data"],
                "created_at": upload["created_at"],
                "expires_at": upload["expires_at"],
                "signed_url": signed_url
            })

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
    Story 2.10: Delete flyer before automatic 7-day expiration

    Removes from both storage and database.
    Only the owner can delete their uploads.
    """
    if not x_clerk_user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    try:
        supabase = get_supabase_client()

        # Get upload record (verify ownership via RLS)
        upload_result = supabase.table("flyer_uploads")\
            .select("*")\
            .eq("id", upload_id)\
            .eq("user_id", x_clerk_user_id)\
            .execute()

        if not upload_result.data:
            raise HTTPException(status_code=404, detail="Upload not found")

        upload = upload_result.data[0]

        # Delete from storage
        try:
            supabase.storage.from_("flyers").remove([upload["storage_path"]])
        except Exception as storage_error:
            logger.warning(f"Storage deletion failed: {storage_error}")
            # Continue with database deletion even if storage fails

        # Delete from database
        supabase.table("flyer_uploads").delete().eq("id", upload_id).execute()

        logger.info(f"Flyer deleted: user={x_clerk_user_id}, upload_id={upload_id}")

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
    Story 2.10 AC: Auto-delete after 7 days

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
                supabase.storage.from_("flyers").remove([upload["storage_path"]])

                # Delete from database
                supabase.table("flyer_uploads").delete().eq("id", upload["id"]).execute()

                deleted_count += 1
            except Exception as e:
                logger.warning(f"Failed to delete expired upload {upload['id']}: {e}")

        logger.info(f"Cleanup completed: {deleted_count} expired uploads deleted")

        return {
            "status": "success",
            "deleted_count": deleted_count,
            "message": f"Cleaned up {deleted_count} expired uploads"
        }

    except Exception as e:
        logger.error(f"Error during cleanup: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
