"""
Database configuration and Supabase client initialization
Story 1.5: Initialize Supabase PostgreSQL Database with PostGIS
"""

import os
from typing import Optional
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()


class Database:
    """
    Supabase PostgreSQL database client with PostGIS extension support

    Story 1.5 Acceptance Criteria:
    - Supabase project created with @supabase/supabase-js client
    - PostGIS extension enabled
    - Backend connects with service key, frontend with anon key
    - Connection verified
    """

    _client: Optional[Client] = None

    @classmethod
    def get_client(cls) -> Client:
        """
        Get or create Supabase client instance (singleton pattern)

        Returns:
            Supabase client configured with service key for backend access

        Raises:
            ValueError: If SUPABASE_URL or SUPABASE_SERVICE_KEY not set
        """
        if cls._client is None:
            url = os.getenv("SUPABASE_URL")
            service_key = os.getenv("SUPABASE_SERVICE_KEY")

            if not url:
                raise ValueError("SUPABASE_URL environment variable not set")
            if not service_key:
                raise ValueError("SUPABASE_SERVICE_KEY environment variable not set")

            cls._client = create_client(url, service_key)

        return cls._client

    @classmethod
    async def verify_connection(cls) -> dict:
        """
        Verify Supabase connection and PostGIS extension availability

        Returns:
            dict: Connection status with database info

        Story 1.5 AC: Connection verified
        """
        try:
            client = cls.get_client()

            # Test connection with a simple query
            # We'll use the REST API to query pg_extension for PostGIS
            response = client.table("pg_extension").select("extname").eq("extname", "postgis").execute()

            postgis_enabled = len(response.data) > 0 if response.data else False

            return {
                "connected": True,
                "url": os.getenv("SUPABASE_URL"),
                "postgis_enabled": postgis_enabled,
                "message": "Database connection successful" if postgis_enabled else "Connected but PostGIS not detected",
            }
        except Exception as e:
            return {
                "connected": False,
                "error": str(e),
                "message": "Database connection failed",
            }


# Convenience function for getting database client
def get_db() -> Client:
    """Get Supabase database client instance"""
    return Database.get_client()
