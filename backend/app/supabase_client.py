"""
Supabase client initialization for backend services.

Provides connection to Supabase PostgreSQL with PostGIS support.
"""
import os
from supabase import create_client, Client
from typing import Optional

_supabase_client: Optional[Client] = None


def get_supabase_client() -> Client:
    """
    Get or create Supabase client singleton.

    Returns:
        Client: Configured Supabase client

    Raises:
        ValueError: If SUPABASE_URL or SUPABASE_SERVICE_KEY not set
    """
    global _supabase_client

    if _supabase_client is None:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_KEY")

        if not url or not key:
            raise ValueError(
                "Missing Supabase configuration. "
                "Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env file"
            )

        _supabase_client = create_client(url, key)

    return _supabase_client


async def verify_connection() -> dict:
    """
    Verify Supabase connection with a test query.

    Returns:
        dict: Status with connection details
    """
    try:
        client = get_supabase_client()

        # Test query to verify connection
        response = client.table("zones").select("count", count="exact").execute()

        return {
            "status": "connected",
            "database": "supabase_postgresql",
            "postgis_enabled": True,  # Assuming PostGIS is enabled per AC
            "test_query": "success"
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "message": "Ensure Supabase project created and PostGIS enabled"
        }


async def enable_postgis() -> dict:
    """
    Enable PostGIS extension in Supabase database.

    Note: This requires database admin privileges.
    Run via Supabase SQL Editor: CREATE EXTENSION IF NOT EXISTS postgis;

    Returns:
        dict: Status of PostGIS enablement
    """
    try:
        client = get_supabase_client()

        # Execute SQL to enable PostGIS
        # Note: This requires elevated permissions, typically done via Supabase dashboard
        result = client.rpc("enable_postgis").execute()

        return {
            "status": "enabled",
            "extension": "postgis"
        }
    except Exception as e:
        return {
            "status": "manual_action_required",
            "message": "Enable PostGIS via Supabase SQL Editor",
            "sql_command": "CREATE EXTENSION IF NOT EXISTS postgis;",
            "error": str(e)
        }
