"""
Story 2.5: Sync Clerk Users to Supabase Database

Webhook endpoint to receive Clerk user.created events and sync to Supabase.
"""
from fastapi import APIRouter, Request, HTTPException, status
from pydantic import BaseModel
import os
import logging
from typing import Optional
from app.supabase_client import get_supabase_client

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


class ClerkUserCreatedEvent(BaseModel):
    """Clerk user.created webhook event structure"""
    type: str  # "user.created"
    data: dict  # User data from Clerk


@router.post("/clerk")
async def clerk_webhook(request: Request):
    """
    Story 2.5 AC: Clerk webhook on user.created fires to backend

    Receives Clerk webhook events and syncs users to Supabase.
    Handles user.created event to insert new user records.
    """
    try:
        # Get webhook payload
        payload = await request.json()
        event_type = payload.get("type")

        # Story 2.5 AC: Handle user.created event
        if event_type == "user.created":
            data = payload.get("data", {})
            clerk_user_id = data.get("id")

            # Extract email (primary email address)
            email_addresses = data.get("email_addresses", [])
            email = None
            for email_obj in email_addresses:
                if email_obj.get("id") == data.get("primary_email_address_id"):
                    email = email_obj.get("email_address")
                    break

            if not email and email_addresses:
                # Fallback to first email if primary not found
                email = email_addresses[0].get("email_address")

            if not clerk_user_id or not email:
                logger.error(f"Missing required user data: clerk_user_id={clerk_user_id}, email={email}")
                return {"status": "error", "message": "Missing required user data"}

            # Story 2.5 AC: New record created in users table
            try:
                supabase = get_supabase_client()
                result = supabase.table("users").insert({
                    "clerk_user_id": clerk_user_id,
                    "email": email
                }).execute()

                logger.info(f"User synced to Supabase: clerk_user_id={clerk_user_id}, email={email}")

                return {
                    "status": "success",
                    "message": "User created in Supabase",
                    "user_id": result.data[0]["id"] if result.data else None
                }

            except Exception as db_error:
                # Story 2.5 AC: Errors logged and handled gracefully
                logger.error(f"Database error syncing user: {str(db_error)}")
                # Don't fail the webhook - Clerk expects 200 response
                return {
                    "status": "error",
                    "message": "Database error",
                    "error": str(db_error)
                }

        else:
            # Other webhook events (user.updated, user.deleted, etc.)
            logger.info(f"Received Clerk webhook event: {event_type}")
            return {"status": "ignored", "event_type": event_type}

    except Exception as e:
        # Story 2.5 AC: Errors logged and handled gracefully
        logger.error(f"Webhook processing error: {str(e)}")
        # Return 200 even on error to prevent Clerk from retrying indefinitely
        return {"status": "error", "message": str(e)}


@router.get("/clerk/health")
async def webhook_health():
    """Health check endpoint for webhook service"""
    return {"status": "ok", "service": "clerk-webhook"}
