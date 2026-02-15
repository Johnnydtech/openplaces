"""
Story 3.6: Implement Venue Geocoding to Lat/Lon
Service for geocoding venue addresses to coordinates using Mapbox API
"""

import os
import httpx
from typing import Optional, Tuple
from pydantic import BaseModel


class GeocodingResult(BaseModel):
    """Geocoding result with coordinates and metadata"""
    latitude: float
    longitude: float
    formatted_address: str
    place_name: str
    within_arlington: bool
    confidence: str  # "High", "Medium", "Low"


class GeocodingError(Exception):
    """Raised when geocoding fails"""
    pass


# Arlington, VA bounding box (approximate)
ARLINGTON_BOUNDS = {
    "min_lat": 38.82,
    "max_lat": 38.93,
    "min_lon": -77.17,
    "max_lon": -77.03
}


def is_within_arlington(lat: float, lon: float) -> bool:
    """
    Check if coordinates are within Arlington, VA bounds

    Args:
        lat: Latitude
        lon: Longitude

    Returns:
        True if within Arlington bounds, False otherwise
    """
    return (
        ARLINGTON_BOUNDS["min_lat"] <= lat <= ARLINGTON_BOUNDS["max_lat"] and
        ARLINGTON_BOUNDS["min_lon"] <= lon <= ARLINGTON_BOUNDS["max_lon"]
    )


async def geocode_venue(venue_address: str) -> Optional[GeocodingResult]:
    """
    Geocode venue address to lat/lon using Mapbox Geocoding API

    Story 3.6 Acceptance Criteria:
    - Address geocoded to lat/lon using Mapbox Geocoding API
    - Coordinates stored with event data
    - Failure shows "Venue not found" message
    - Completes within 2 seconds
    - Coordinates validated within Arlington, VA bounds

    Args:
        venue_address: Address to geocode (e.g., "123 Main St, Arlington, VA")

    Returns:
        GeocodingResult with coordinates and metadata, or None if geocoding fails

    Raises:
        GeocodingError: If geocoding request fails
    """
    mapbox_api_key = os.getenv("MAPBOX_API_KEY")
    if not mapbox_api_key:
        raise GeocodingError("MAPBOX_API_KEY not configured")

    # Mapbox Geocoding API endpoint
    base_url = "https://api.mapbox.com/geocoding/v5/mapbox.places"

    # Add "Arlington, VA" to query if not already present for better results
    query = venue_address
    if "arlington" not in query.lower():
        query = f"{venue_address}, Arlington, VA"

    # Build request URL with parameters
    url = f"{base_url}/{query}.json"
    params = {
        "access_token": mapbox_api_key,
        "limit": 1,  # Only return top result
        "country": "us",  # Restrict to United States
        "proximity": "-77.0910,38.8816",  # Arlington center (lon,lat format for Mapbox)
        "types": "address,poi"  # Allow addresses and points of interest
    }

    try:
        # Story 3.6 AC: Completes within 2 seconds
        async with httpx.AsyncClient(timeout=2.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()

            data = response.json()
            features = data.get("features", [])

            if not features:
                # Story 3.6 AC: Failure shows "Venue not found" message
                return None

            # Extract top result
            feature = features[0]
            coordinates = feature["geometry"]["coordinates"]
            lon, lat = coordinates  # Mapbox returns [lon, lat]

            # Story 3.6 AC: Coordinates validated within Arlington, VA bounds
            within_arlington = is_within_arlington(lat, lon)

            # Determine confidence based on relevance score and Arlington location
            relevance = feature.get("relevance", 0)
            if relevance >= 0.9 and within_arlington:
                confidence = "High"
            elif relevance >= 0.7:
                confidence = "Medium"
            else:
                confidence = "Low"

            return GeocodingResult(
                latitude=lat,
                longitude=lon,
                formatted_address=feature.get("place_name", venue_address),
                place_name=feature.get("text", venue_address),
                within_arlington=within_arlington,
                confidence=confidence
            )

    except httpx.TimeoutException:
        raise GeocodingError("Geocoding request timed out (>2 seconds)")
    except httpx.HTTPStatusError as e:
        raise GeocodingError(f"Geocoding API error: {e.response.status_code}")
    except Exception as e:
        raise GeocodingError(f"Geocoding failed: {str(e)}")
