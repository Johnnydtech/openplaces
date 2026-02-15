"""
Story 3.6: Test Venue Geocoding to Lat/Lon
Tests for geocoding service and API endpoint
"""

import pytest
from unittest.mock import patch, AsyncMock
from app.services.geocoding import (
    geocode_venue,
    is_within_arlington,
    GeocodingError,
    GeocodingResult,
)


class TestArlingtonBounds:
    """Test Story 3.6 AC: Coordinates validated within Arlington, VA bounds"""

    def test_is_within_arlington_valid_coordinates(self):
        """Test coordinates within Arlington bounds return True"""
        # Arlington Metro Center (definitely in Arlington)
        assert is_within_arlington(38.8816, -77.0910) is True

        # Ballston (in Arlington)
        assert is_within_arlington(38.8821, -77.1115) is True

    def test_is_within_arlington_invalid_coordinates(self):
        """Test coordinates outside Arlington bounds return False"""
        # Washington DC (south of Arlington)
        assert is_within_arlington(38.9072, -77.0369) is False

        # Falls Church (west of Arlington)
        assert is_within_arlington(38.8823, -77.1711) is False


class TestGeocodeVenue:
    """Test Story 3.6: Implement Venue Geocoding to Lat/Lon"""

    @pytest.mark.asyncio
    @patch("app.services.geocoding.httpx.AsyncClient")
    async def test_geocode_venue_success(self, mock_client):
        """
        Story 3.6 AC: Address geocoded to lat/lon using Mapbox Geocoding API
        """
        # Mock Mapbox API response
        mock_response = AsyncMock()
        mock_response.json.return_value = {
            "features": [
                {
                    "geometry": {"coordinates": [-77.0910, 38.8816]},
                    "place_name": "123 Main St, Arlington, VA 22201",
                    "text": "123 Main St",
                    "relevance": 0.95,
                }
            ]
        }
        mock_response.raise_for_status = AsyncMock()

        mock_client_instance = AsyncMock()
        mock_client_instance.get.return_value = mock_response
        mock_client.return_value.__aenter__.return_value = mock_client_instance

        # Mock environment variable
        with patch("os.getenv", return_value="test_mapbox_key"):
            result = await geocode_venue("123 Main St, Arlington, VA")

        # Assertions
        assert result is not None
        assert result.latitude == 38.8816
        assert result.longitude == -77.0910
        assert result.within_arlington is True
        assert result.confidence == "High"  # relevance 0.95 + within Arlington

    @pytest.mark.asyncio
    @patch("app.services.geocoding.httpx.AsyncClient")
    async def test_geocode_venue_not_found(self, mock_client):
        """
        Story 3.6 AC: Failure shows "Venue not found" message
        """
        # Mock Mapbox API response with no results
        mock_response = AsyncMock()
        mock_response.json.return_value = {"features": []}
        mock_response.raise_for_status = AsyncMock()

        mock_client_instance = AsyncMock()
        mock_client_instance.get.return_value = mock_response
        mock_client.return_value.__aenter__.return_value = mock_client_instance

        with patch("os.getenv", return_value="test_mapbox_key"):
            result = await geocode_venue("Nonexistent Address XYZ")

        # Should return None when no results
        assert result is None

    @pytest.mark.asyncio
    @patch("app.services.geocoding.httpx.AsyncClient")
    async def test_geocode_venue_timeout(self, mock_client):
        """
        Story 3.6 AC: Completes within 2 seconds (timeout handling)
        """
        # Mock timeout exception
        mock_client_instance = AsyncMock()
        mock_client_instance.get.side_effect = Exception("Timeout")
        mock_client.return_value.__aenter__.return_value = mock_client_instance

        with patch("os.getenv", return_value="test_mapbox_key"):
            with pytest.raises(GeocodingError, match="Geocoding failed"):
                await geocode_venue("123 Main St")

    @pytest.mark.asyncio
    async def test_geocode_venue_no_api_key(self):
        """Test error handling when MAPBOX_API_KEY not configured"""
        with patch("os.getenv", return_value=None):
            with pytest.raises(GeocodingError, match="MAPBOX_API_KEY not configured"):
                await geocode_venue("123 Main St")

    @pytest.mark.asyncio
    @patch("app.services.geocoding.httpx.AsyncClient")
    async def test_geocode_venue_medium_confidence(self, mock_client):
        """Test medium confidence for addresses outside Arlington"""
        # Mock response for address outside Arlington
        mock_response = AsyncMock()
        mock_response.json.return_value = {
            "features": [
                {
                    "geometry": {"coordinates": [-77.1711, 38.8823]},  # Falls Church
                    "place_name": "100 Main St, Falls Church, VA",
                    "text": "100 Main St",
                    "relevance": 0.75,
                }
            ]
        }
        mock_response.raise_for_status = AsyncMock()

        mock_client_instance = AsyncMock()
        mock_client_instance.get.return_value = mock_response
        mock_client.return_value.__aenter__.return_value = mock_client_instance

        with patch("os.getenv", return_value="test_mapbox_key"):
            result = await geocode_venue("100 Main St, Falls Church, VA")

        assert result is not None
        assert result.within_arlington is False
        assert result.confidence == "Medium"  # relevance 0.75, not in Arlington
