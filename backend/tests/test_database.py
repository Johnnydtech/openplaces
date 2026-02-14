"""
Tests for Supabase database connection and initialization
Story 1.5: Initialize Supabase PostgreSQL Database
"""

import pytest
import os
from unittest.mock import patch, MagicMock
from app.database import Database, get_db


class TestDatabaseConnection:
    """Test suite for Story 1.5: Initialize Supabase PostgreSQL Database"""

    def test_get_client_without_env_vars_raises_error(self):
        """
        Given: SUPABASE_URL or SUPABASE_SERVICE_KEY not set
        When: Attempting to get database client
        Then: ValueError raised with clear message
        """
        # Reset singleton
        Database._client = None

        with patch.dict(os.environ, {}, clear=True):
            with pytest.raises(ValueError, match="SUPABASE_URL"):
                Database.get_client()

    def test_get_client_without_service_key_raises_error(self):
        """
        Given: SUPABASE_URL set but SUPABASE_SERVICE_KEY not set
        When: Attempting to get database client
        Then: ValueError raised about missing service key
        """
        # Reset singleton
        Database._client = None

        with patch.dict(os.environ, {"SUPABASE_URL": "https://test.supabase.co"}, clear=True):
            with pytest.raises(ValueError, match="SUPABASE_SERVICE_KEY"):
                Database.get_client()

    @patch("app.database.create_client")
    def test_get_client_creates_supabase_client(self, mock_create_client):
        """
        Given: Valid SUPABASE_URL and SUPABASE_SERVICE_KEY
        When: Getting database client
        Then: Supabase client created with correct credentials

        Story 1.5 AC: Backend connects with service key
        """
        # Reset singleton
        Database._client = None

        mock_client = MagicMock()
        mock_create_client.return_value = mock_client

        test_url = "https://test.supabase.co"
        test_key = "test-service-key"

        with patch.dict(os.environ, {"SUPABASE_URL": test_url, "SUPABASE_SERVICE_KEY": test_key}):
            client = Database.get_client()

            # Verify create_client called with correct parameters
            mock_create_client.assert_called_once_with(test_url, test_key)
            assert client == mock_client

    @patch("app.database.create_client")
    def test_get_client_singleton_pattern(self, mock_create_client):
        """
        Given: Database client already initialized
        When: Calling get_client multiple times
        Then: Same client instance returned (singleton)
        """
        # Reset singleton
        Database._client = None

        mock_client = MagicMock()
        mock_create_client.return_value = mock_client

        test_url = "https://test.supabase.co"
        test_key = "test-service-key"

        with patch.dict(os.environ, {"SUPABASE_URL": test_url, "SUPABASE_SERVICE_KEY": test_key}):
            client1 = Database.get_client()
            client2 = Database.get_client()

            # Should only create client once
            assert mock_create_client.call_count == 1
            assert client1 is client2

    @pytest.mark.asyncio
    @patch("app.database.Database.get_client")
    async def test_verify_connection_with_postgis(self, mock_get_client):
        """
        Given: Supabase connected with PostGIS extension enabled
        When: Verifying connection
        Then: Returns success with postgis_enabled=True

        Story 1.5 AC: PostGIS enabled, connection verified
        """
        # Mock client with PostGIS extension found
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.data = [{"extname": "postgis"}]
        mock_client.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        mock_get_client.return_value = mock_client

        test_url = "https://test.supabase.co"

        with patch.dict(os.environ, {"SUPABASE_URL": test_url}):
            result = await Database.verify_connection()

            assert result["connected"] is True
            assert result["postgis_enabled"] is True
            assert "successful" in result["message"]
            assert result["url"] == test_url

    @pytest.mark.asyncio
    @patch("app.database.Database.get_client")
    async def test_verify_connection_without_postgis(self, mock_get_client):
        """
        Given: Supabase connected but PostGIS not enabled
        When: Verifying connection
        Then: Returns connected=True but postgis_enabled=False with warning
        """
        # Mock client without PostGIS
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.data = []
        mock_client.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        mock_get_client.return_value = mock_client

        test_url = "https://test.supabase.co"

        with patch.dict(os.environ, {"SUPABASE_URL": test_url}):
            result = await Database.verify_connection()

            assert result["connected"] is True
            assert result["postgis_enabled"] is False
            assert "PostGIS not detected" in result["message"]

    @pytest.mark.asyncio
    @patch("app.database.Database.get_client")
    async def test_verify_connection_failure(self, mock_get_client):
        """
        Given: Database connection fails
        When: Verifying connection
        Then: Returns connected=False with error details
        """
        # Mock client that raises exception
        mock_get_client.side_effect = Exception("Connection timeout")

        with patch.dict(os.environ, {"SUPABASE_URL": "https://test.supabase.co"}):
            result = await Database.verify_connection()

            assert result["connected"] is False
            assert "error" in result
            assert "Connection timeout" in result["error"]
            assert "failed" in result["message"]

    @patch("app.database.Database.get_client")
    def test_get_db_convenience_function(self, mock_get_client):
        """
        Given: Convenience function get_db()
        When: Called
        Then: Returns database client from Database.get_client()
        """
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client

        client = get_db()

        mock_get_client.assert_called_once()
        assert client == mock_client
