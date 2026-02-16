"""
Zones API Routes - Story 4.1
Endpoints for fetching placement zone data
Enhanced with dynamic zone management from Google Places + Arlington Parking
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
import logging
from app.services.zones import zones_service, Zone

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["zones"])


@router.get("/zones")
async def get_zones() -> List[Zone]:
    """
    Get all placement zones (dynamic or static)

    Returns:
        List of Zone objects with all properties

    Example:
        GET /api/zones
    """
    try:
        zones = await zones_service.get_all_zones()
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
        zones = await zones_service.get_all_zones()
        return {"count": len(zones)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get zones count: {str(e)}")


@router.get("/zones/status")
async def get_zones_status():
    """
    Get current zones status and configuration

    Returns information about:
    - Whether dynamic zones are enabled
    - Number of zones loaded
    - Last refresh time
    - Cache validity
    """
    try:
        zones = await zones_service.get_all_zones()

        return {
            "success": True,
            "dynamic_zones_enabled": zones_service._use_dynamic_zones,
            "zone_count": len(zones),
            "last_refresh": zones_service._last_refresh.isoformat() if zones_service._last_refresh else None,
            "cache_valid": zones_service._is_cache_valid() if zones_service._use_dynamic_zones else None,
            "cache_ttl_hours": zones_service._cache_ttl.total_seconds() / 3600,
            "using_dynamic_zones": zones_service._dynamic_zones is not None,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get zones status: {str(e)}")


@router.post("/zones/refresh")
async def refresh_zones():
    """
    Force refresh zones from Google Places + Arlington Parking APIs

    This will:
    - Fetch latest parking locations from Arlington
    - Query Google Places for nearby venues
    - Generate new zone recommendations
    - Update the cache

    Note: This may take 10-30 seconds depending on API response times
    """
    try:
        logger.info("Manual zone refresh requested")
        zone_count = await zones_service.refresh_zones()

        return {
            "success": True,
            "message": f"Successfully refreshed {zone_count} zones from Google Places + Arlington Parking",
            "zone_count": zone_count,
            "timestamp": zones_service._last_refresh.isoformat() if zones_service._last_refresh else None
        }
    except Exception as e:
        logger.error(f"Error refreshing zones: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to refresh zones: {str(e)}. Check API keys and connectivity."
        )


@router.post("/zones/import-static")
async def import_static_zones():
    """
    Import static zones from zones.geojson file into database

    This is a one-time migration endpoint to populate the database
    with the curated static zones from app/data/zones.geojson.

    After import:
    - Zones will be persisted in database
    - Server restarts will load instantly from database
    - You can later refresh with dynamic zones from APIs

    Note: Will only import if database is empty (safety check)
    """
    try:
        logger.info("Static zone import requested")
        zone_count = await zones_service.import_static_zones_to_database()

        if zone_count == 0:
            return {
                "success": False,
                "message": "Database already has zones. Clear database first or use /zones/refresh to update.",
                "zone_count": 0
            }

        return {
            "success": True,
            "message": f"Successfully imported {zone_count} static zones from zones.geojson to database",
            "zone_count": zone_count,
            "source": "static zones.geojson",
            "next_steps": "Zones are now persisted. You can later refresh with dynamic data using POST /api/zones/refresh"
        }
    except Exception as e:
        logger.error(f"Error importing static zones: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to import static zones: {str(e)}"
        )


@router.delete("/zones/clear")
async def clear_zones():
    """
    Clear all zones from database

    WARNING: This will delete all zones from the database.
    Use this to:
    - Start fresh before importing static zones
    - Force re-generation from APIs
    - Clean up test data

    After clearing:
    - Next request will regenerate zones from APIs (10-30s delay)
    - Or use POST /api/zones/import-static to re-import from file
    """
    try:
        from app.supabase_client import get_supabase_client
        supabase = get_supabase_client()

        # Count zones before deletion
        count_before = supabase.table("zones").select("id", count="exact").execute()
        zone_count = len(count_before.data) if count_before.data else 0

        # Delete all zones
        supabase.table("zones").delete().neq("id", "").execute()

        # Clear memory cache
        zones_service._dynamic_zones = None
        zones_service._last_refresh = None

        logger.info(f"Cleared {zone_count} zones from database")

        return {
            "success": True,
            "message": f"Cleared {zone_count} zones from database",
            "deleted_count": zone_count,
            "next_steps": "Import static zones with POST /api/zones/import-static or refresh from APIs with POST /api/zones/refresh"
        }
    except Exception as e:
        logger.error(f"Error clearing zones: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to clear zones: {str(e)}"
        )
