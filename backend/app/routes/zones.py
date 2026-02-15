"""
Zones API Routes - Story 4.1
Endpoints for fetching placement zone data
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.services.zones import zones_service, Zone

router = APIRouter(prefix="/api", tags=["zones"])


@router.get("/zones")
async def get_zones() -> List[Zone]:
    """
    Get all placement zones

    Returns:
        List of Zone objects with all properties

    Example:
        GET /api/zones
    """
    try:
        zones = zones_service.get_all_zones()
        return zones
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=f"Zones data not found: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load zones: {str(e)}")


@router.get("/zones/geojson")
async def get_zones_geojson() -> Dict[str, Any]:
    """
    Get zones as GeoJSON FeatureCollection
    (Optimized for map visualization)

    Returns:
        GeoJSON FeatureCollection with all zone features

    Example:
        GET /api/zones/geojson
    """
    try:
        geojson = zones_service.get_zones_geojson()
        return geojson
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=f"Zones data not found: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load zones: {str(e)}")


@router.get("/zones/{zone_id}")
async def get_zone(zone_id: str) -> Zone:
    """
    Get a single zone by ID

    Args:
        zone_id: Zone identifier (e.g., "ballston-metro")

    Returns:
        Zone object with all properties

    Raises:
        404: Zone not found

    Example:
        GET /api/zones/ballston-metro
    """
    try:
        zone = zones_service.get_zone_by_id(zone_id)
        if zone is None:
            raise HTTPException(status_code=404, detail=f"Zone not found: {zone_id}")
        return zone
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load zone: {str(e)}")


@router.get("/zones-count")
async def get_zones_count() -> Dict[str, int]:
    """
    Get total number of zones

    Returns:
        Count of zones

    Example:
        GET /api/zones-count
        Response: {"count": 30}
    """
    try:
        count = zones_service.get_zones_count()
        return {"count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get zones count: {str(e)}")
