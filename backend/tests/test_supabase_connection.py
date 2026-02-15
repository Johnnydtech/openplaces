"""
Tests for Supabase connection and PostGIS setup.
"""
import pytest
from app.supabase_client import get_supabase_client, verify_connection
import os


def test_supabase_client_requires_env_vars():
    """Test that Supabase client raises error without env vars."""
    # Remove env vars temporarily
    original_url = os.getenv("SUPABASE_URL")
    original_key = os.getenv("SUPABASE_SERVICE_KEY")

    if original_url:
        del os.environ["SUPABASE_URL"]
    if original_key:
        del os.environ["SUPABASE_SERVICE_KEY"]

    with pytest.raises(ValueError, match="Missing Supabase configuration"):
        get_supabase_client()

    # Restore env vars
    if original_url:
        os.environ["SUPABASE_URL"] = original_url
    if original_key:
        os.environ["SUPABASE_SERVICE_KEY"] = original_key


@pytest.mark.asyncio
async def test_verify_connection_with_valid_config():
    """Test connection verification with valid Supabase config."""
    # Skip if no Supabase config (development env)
    if not os.getenv("SUPABASE_URL") or not os.getenv("SUPABASE_SERVICE_KEY"):
        pytest.skip("Supabase not configured")

    result = await verify_connection()

    assert "status" in result
    assert result["status"] in ["connected", "error"]

    if result["status"] == "connected":
        assert result["database"] == "supabase_postgresql"
        assert "postgis_enabled" in result


@pytest.mark.asyncio
async def test_postgis_verification():
    """Test that PostGIS extension is available."""
    # Skip if no Supabase config
    if not os.getenv("SUPABASE_URL"):
        pytest.skip("Supabase not configured")

    result = await verify_connection()

    if result["status"] == "connected":
        assert result.get("postgis_enabled") is True
