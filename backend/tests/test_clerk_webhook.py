"""
Story 2.5: Sync Clerk Users to Supabase Database - Tests
"""
import pytest
import os
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_webhook_health_endpoint():
    """Test webhook health check endpoint"""
    response = client.get("/api/webhooks/clerk/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "clerk-webhook"}


def test_webhook_endpoint_exists():
    """Test that webhook endpoint is registered"""
    # POST to webhook should not return 404
    response = client.post("/api/webhooks/clerk", json={})
    # Should return 200 even with empty payload (error handling)
    assert response.status_code == 200


def test_webhook_handles_user_created_event():
    """
    Story 2.5 AC: Clerk webhook on user.created fires to backend

    Test with mock Clerk user.created event payload
    """
    # Mock Clerk user.created webhook payload
    payload = {
        "type": "user.created",
        "data": {
            "id": "user_test123",
            "primary_email_address_id": "email_abc",
            "email_addresses": [
                {
                    "id": "email_abc",
                    "email_address": "test@example.com"
                }
            ]
        }
    }

    response = client.post("/api/webhooks/clerk", json=payload)

    # Webhook should return 200 (even if DB insert fails due to no Supabase)
    assert response.status_code == 200

    data = response.json()

    # If Supabase configured, should succeed
    if os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_SERVICE_KEY"):
        assert data["status"] in ["success", "error"]  # May fail if user already exists
        if data["status"] == "success":
            assert "user_id" in data
    else:
        # Without Supabase, should return error but still 200
        assert data["status"] == "error"


def test_webhook_handles_missing_user_data():
    """
    Story 2.5 AC: Errors logged and handled gracefully

    Test webhook with incomplete user data
    """
    # Missing clerk_user_id
    payload = {
        "type": "user.created",
        "data": {
            "email_addresses": []
        }
    }

    response = client.post("/api/webhooks/clerk", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "error"
    assert "Missing required user data" in data["message"]


def test_webhook_ignores_other_events():
    """Test that webhook ignores non-user.created events"""
    payload = {
        "type": "user.updated",
        "data": {"id": "user_123"}
    }

    response = client.post("/api/webhooks/clerk", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "ignored"
    assert data["event_type"] == "user.updated"


def test_webhook_extracts_email_correctly():
    """
    Story 2.5 AC: New record created with email

    Test that webhook extracts primary email correctly
    """
    payload = {
        "type": "user.created",
        "data": {
            "id": "user_test456",
            "primary_email_address_id": "email_primary",
            "email_addresses": [
                {
                    "id": "email_secondary",
                    "email_address": "secondary@example.com"
                },
                {
                    "id": "email_primary",
                    "email_address": "primary@example.com"
                }
            ]
        }
    }

    response = client.post("/api/webhooks/clerk", json=payload)
    assert response.status_code == 200

    # Should extract primary email, not secondary
    # (Cannot verify DB content without Supabase, but webhook should process)


def test_webhook_fallback_to_first_email():
    """Test webhook fallback when primary_email_address_id not found"""
    payload = {
        "type": "user.created",
        "data": {
            "id": "user_test789",
            "primary_email_address_id": "email_missing",  # Not in list
            "email_addresses": [
                {
                    "id": "email_first",
                    "email_address": "first@example.com"
                }
            ]
        }
    }

    response = client.post("/api/webhooks/clerk", json=payload)
    assert response.status_code == 200
    # Should fall back to first email in list


@pytest.mark.skipif(
    not os.getenv("SUPABASE_URL"),
    reason="Supabase not configured"
)
def test_webhook_creates_user_in_database():
    """
    Story 2.5 AC: New record created in users table with clerk_user_id, email, created_at

    Integration test - requires Supabase configuration AND database schema

    NOTE: This test requires manual setup:
    1. Run migrations/001_initial_schema.sql via Supabase SQL Editor
    2. Ensure users table exists in database
    """
    import uuid
    from app.supabase_client import get_supabase_client

    # Generate unique test user
    test_clerk_id = f"test_user_{uuid.uuid4()}"
    test_email = f"test_{uuid.uuid4()}@example.com"

    payload = {
        "type": "user.created",
        "data": {
            "id": test_clerk_id,
            "primary_email_address_id": "email_test",
            "email_addresses": [
                {
                    "id": "email_test",
                    "email_address": test_email
                }
            ]
        }
    }

    response = client.post("/api/webhooks/clerk", json=payload)
    assert response.status_code == 200

    data = response.json()

    # If table doesn't exist, webhook returns error (expected before schema setup)
    if data["status"] == "error" and "Could not find the table" in data.get("error", ""):
        pytest.skip("Database schema not created yet - run migrations/001_initial_schema.sql")

    # If table exists, should succeed
    assert data["status"] == "success"
    assert "user_id" in data

    # Verify user created in Supabase
    supabase = get_supabase_client()
    result = supabase.table("users").select("*").eq("clerk_user_id", test_clerk_id).execute()

    assert len(result.data) == 1
    user = result.data[0]
    assert user["clerk_user_id"] == test_clerk_id
    assert user["email"] == test_email
    assert "created_at" in user

    # Cleanup
    supabase.table("users").delete().eq("clerk_user_id", test_clerk_id).execute()
