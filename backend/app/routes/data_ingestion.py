"""
Data Ingestion API Routes
Endpoints for fetching and refreshing real data from Arlington and Google APIs
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import logging

from app.services.data_ingestion import data_ingestion_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/data", tags=["data-ingestion"])


@router.post("/generate-zones")
async def generate_zones(limit: int = 50) -> Dict[str, Any]:
    """
    Generate placement zones from real Arlington parking data + Google Places

    Args:
        limit: Maximum number of zones to generate (default 50)

    Returns:
        Generated zones data
    """
    try:
        logger.info(f"Generating zones with limit={limit}")

        zones = await data_ingestion_service.generate_zones_from_parking_data(limit=limit)

        return {
            "success": True,
            "zones_generated": len(zones),
            "zones": zones,
            "message": f"Successfully generated {len(zones)} zones from real data"
        }

    except Exception as e:
        logger.error(f"Error generating zones: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/parking-locations")
async def get_parking_locations() -> Dict[str, Any]:
    """
    Fetch raw parking location data from Arlington API
    Useful for debugging and understanding available data
    """
    try:
        locations = await data_ingestion_service.fetch_arlington_parking_locations()

        return {
            "success": True,
            "count": len(locations),
            "locations": locations[:10],  # Return first 10 for preview
            "message": f"Fetched {len(locations)} parking locations from Arlington"
        }

    except Exception as e:
        logger.error(f"Error fetching parking locations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/test-google-places")
async def test_google_places(lat: float = 38.8816, lon: float = -77.0910) -> Dict[str, Any]:
    """
    Test Google Places API integration
    Default: Arlington, VA center

    Args:
        lat: Latitude (default: Arlington center)
        lon: Longitude (default: Arlington center)
    """
    try:
        venues = await data_ingestion_service.fetch_google_places_nearby(lat, lon, radius=200)

        return {
            "success": True,
            "count": len(venues),
            "venues": venues,
            "message": f"Found {len(venues)} venues near ({lat}, {lon})"
        }

    except Exception as e:
        logger.error(f"Error testing Google Places: {e}")
        raise HTTPException(status_code=500, detail=str(e))
