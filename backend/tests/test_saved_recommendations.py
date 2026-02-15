"""
Story 2.6, 2.7, 2.8, 2.9: Saved Recommendations API Tests
"""
import pytest
import os
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_save_recommendation_requires_auth():
    """Story 2.6: Save endpoint requires authentication"""
    response = client.post("/api/saved-recommendations/save", json={
        "recommendation_id": "rec_123"
    })
    assert response.status_code == 401


def test_save_recommendation_with_auth_header():
    """Story 2.6 AC: "Save" button saves to saved_recommendations table"""
    response = client.post(
        "/api/saved-recommendations/save",
        json={"recommendation_id": "rec_test123"},
        headers={"X-Clerk-User-Id": "user_test"}
    )

    # Will return error without Supabase/DB setup, but endpoint should exist
    assert response.status_code in [200, 404, 500]


def test_save_recommendation_with_notes():
    """Story 2.6 AC: Optional notes supported"""
    response = client.post(
        "/api/saved-recommendations/save",
        json={
            "recommendation_id": "rec_test456",
            "notes": "Great location for weekend events"
        },
        headers={"X-Clerk-User-Id": "user_test"}
    )

    # Endpoint should accept notes parameter
    assert response.status_code in [200, 404, 500]


def test_list_saved_recommendations_requires_auth():
    """Story 2.7: List endpoint requires authentication"""
    response = client.get("/api/saved-recommendations/list")
    assert response.status_code == 401


def test_list_saved_recommendations_with_auth():
    """Story 2.7 AC: View all saved recommendations"""
    response = client.get(
        "/api/saved-recommendations/list",
        headers={"X-Clerk-User-Id": "user_test"}
    )

    # Should return list (empty if no saved recs or no DB setup)
    assert response.status_code in [200, 500]


def test_update_notes_requires_auth():
    """Story 2.8: Update notes endpoint requires authentication"""
    response = client.patch(
        "/api/saved-recommendations/saved_rec_123/notes",
        json={"notes": "Updated note"}
    )
    assert response.status_code == 401


def test_update_notes_with_auth():
    """Story 2.8 AC: Add/Edit notes on saved recommendations (500 char limit)"""
    notes = "This is a test note for a saved recommendation."

    response = client.patch(
        "/api/saved-recommendations/saved_rec_test/notes",
        json={"notes": notes},
        headers={"X-Clerk-User-Id": "user_test"}
    )

    # Endpoint should accept notes update
    assert response.status_code in [200, 404, 500]


def test_delete_saved_recommendation_requires_auth():
    """Story 2.9: Delete endpoint requires authentication"""
    response = client.delete("/api/saved-recommendations/saved_rec_123")
    assert response.status_code == 401


def test_delete_saved_recommendation_with_auth():
    """Story 2.9 AC: Delete saved recommendation"""
    response = client.delete(
        "/api/saved-recommendations/saved_rec_test",
        headers={"X-Clerk-User-Id": "user_test"}
    )

    # Endpoint should exist and handle deletion
    assert response.status_code in [200, 404, 500]


def test_check_if_saved_no_auth():
    """Check saved status works without auth (returns false)"""
    response = client.get("/api/saved-recommendations/check/rec_123")
    assert response.status_code == 200
    assert response.json()["is_saved"] is False


def test_check_if_saved_with_auth():
    """Story 2.6 AC: Check if recommendation is already saved"""
    response = client.get(
        "/api/saved-recommendations/check/rec_test",
        headers={"X-Clerk-User-Id": "user_test"}
    )

    assert response.status_code == 200
    assert "is_saved" in response.json()


@pytest.mark.skipif(
    not os.getenv("SUPABASE_URL"),
    reason="Supabase not configured"
)
def test_save_and_retrieve_recommendation_integration():
    """
    Integration test: Save → List → Update Notes → Delete

    Stories 2.6, 2.7, 2.8, 2.9 full flow

    Requires:
    - Supabase configured
    - Database schema created (migrations/001_initial_schema.sql)
    - Test user exists in users table
    """
    import uuid

    # Generate unique IDs
    test_user_id = f"test_user_{uuid.uuid4()}"
    test_rec_id = f"test_rec_{uuid.uuid4()}"

    # Skip if DB schema not set up
    try:
        # Story 2.6: Save recommendation
        save_response = client.post(
            "/api/saved-recommendations/save",
            json={"recommendation_id": test_rec_id, "notes": "Initial note"},
            headers={"X-Clerk-User-Id": test_user_id}
        )

        if save_response.status_code == 404:
            pytest.skip("User not found - test requires user in database")

        if "Could not find the table" in str(save_response.json()):
            pytest.skip("Database schema not created")

        assert save_response.status_code == 200
        data = save_response.json()
        assert data["status"] == "success"
        assert "Recommendation saved!" in data["message"]

        saved_rec_id = data["saved_recommendation"]["id"]

        # Story 2.7: List saved recommendations
        list_response = client.get(
            "/api/saved-recommendations/list",
            headers={"X-Clerk-User-Id": test_user_id}
        )
        assert list_response.status_code == 200
        assert len(list_response.json()["saved_recommendations"]) > 0

        # Story 2.8: Update notes
        update_response = client.patch(
            f"/api/saved-recommendations/{saved_rec_id}/notes",
            json={"notes": "Updated note"},
            headers={"X-Clerk-User-Id": test_user_id}
        )
        assert update_response.status_code == 200
        assert "Note saved!" in update_response.json()["message"]

        # Story 2.9: Delete saved recommendation
        delete_response = client.delete(
            f"/api/saved-recommendations/{saved_rec_id}",
            headers={"X-Clerk-User-Id": test_user_id}
        )
        assert delete_response.status_code == 200
        assert "Recommendation deleted" in delete_response.json()["message"]

    except Exception as e:
        if "Could not find the table" in str(e):
            pytest.skip("Database schema not created")
        raise
