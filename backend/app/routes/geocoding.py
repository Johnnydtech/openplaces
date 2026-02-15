"""
Story 3.6: Implement Venue Geocoding to Lat/Lon
API endpoint for geocoding venue addresses to coordinates
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.geocoding import geocode_venue, GeocodingError, GeocodingResult
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class GeocodeRequest(BaseModel):
    """Request model for geocoding endpoint"""
    venue_address: str


class GeocodeResponse(BaseModel):
    """Response model for geocoding endpoint"""
    latitude: float
    longitude: float
    formatted_address: str
    place_name: str
    within_arlington: bool
    confidence: str


@router.post("/geocode", response_model=GeocodeResponse)
async def geocode_address(request: GeocodeRequest):
    """
    Geocode venue address to lat/lon coordinates

    Story 3.6 Acceptance Criteria:
    - Address geocoded to lat/lon using Mapbox Geocoding API
    - Coordinates stored with event data
    - Failure shows "Venue not found" message
    - Completes within 2 seconds
    - Coordinates validated within Arlington, VA bounds

    Args:
        request: GeocodeRequest with venue_address

    Returns:
        GeocodeResponse with coordinates and metadata

    Raises:
        HTTPException 404: Venue not found
        HTTPException 400: Invalid request
        HTTPException 500: Geocoding service error
    """
    if not request.venue_address or not request.venue_address.strip():
        raise HTTPException(
            status_code=400,
            detail="Venue address is required"
        )

    try:
        # Call geocoding service (2 second timeout)
        result = await geocode_venue(request.venue_address)

        if result is None:
            # Story 3.6 AC: Failure shows "Venue not found" message
            raise HTTPException(
                status_code=404,
                detail="Venue not found. Please check the address and try again."
            )

        # Log geocoding success
        logger.info(
            f"Geocoded '{request.venue_address}' to ({result.latitude}, {result.longitude}) "
            f"[within_arlington={result.within_arlington}, confidence={result.confidence}]"
        )

        return GeocodeResponse(
            latitude=result.latitude,
            longitude=result.longitude,
            formatted_address=result.formatted_address,
            place_name=result.place_name,
            within_arlington=result.within_arlington,
            confidence=result.confidence
        )

    except GeocodingError as e:
        logger.error(f"Geocoding error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Geocoding service error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error during geocoding: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred during geocoding"
        )
