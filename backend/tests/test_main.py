"""
Tests for main FastAPI application endpoints
Story 1.2 and Story 1.3 acceptance criteria
"""

import pytest
from fastapi.testclient import TestClient


def test_root_endpoint(client):
    """
    Test that root endpoint returns API information
    """
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "OpenPlaces API"
    assert data["version"] == "0.1.0"
    assert "docs" in data


def test_health_check_endpoint(client):
    """
    Test health check endpoint
    Story 1.3 AC: Returns {"status": "ok"}
    """
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_api_status_endpoint(client):
    """
    Test extended status endpoint
    """
    response = client.get("/api/status")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"] == "running"
    assert "features" in data
    assert "openai_configured" in data["features"]
    assert "supabase_configured" in data["features"]
    assert "mapbox_configured" in data["features"]


def test_api_docs_available(client):
    """
    Test that OpenAPI docs are accessible
    Story 1.2 AC: Auto-generated docs at /docs
    """
    response = client.get("/docs")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]


def test_cors_headers(client):
    """
    Test that CORS headers are properly configured
    Story 1.3 AC: CORS middleware configured for localhost:5173
    """
    # Simulate preflight request
    response = client.options(
        "/api/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    # FastAPI's CORS middleware should handle this
    assert response.status_code in [200, 204]
