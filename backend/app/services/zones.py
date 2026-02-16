"""
Zones Service - Story 4.1
Handles loading and serving placement zone data for Arlington, VA
Enhanced with dynamic zone generation from Google Places + Arlington Parking
"""

import json
import os
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
from app.supabase_client import get_supabase_client

logger = logging.getLogger(__name__)


class Zone(BaseModel):
    """
    Placement zone model matching GeoJSON feature properties
    """
    id: str
    name: str
    coordinates: Dict[str, float]  # {"lat": float, "lon": float}
    audience_signals: Dict[str, Any]
    timing_windows: Dict[str, Any]
    dwell_time_seconds: int
    cost_tier: str
    foot_traffic_daily: Optional[int] = None


class ZonesService:
    """
    Service for loading and managing placement zones data
    Supports both static zones (GeoJSON file) and dynamic zones (Google Places + Arlington Parking)
    """

    def __init__(self, use_dynamic_zones: bool = True, cache_ttl_hours: int = 24):
        self._zones: Optional[List[Zone]] = None
        self._zones_geojson: Optional[Dict[str, Any]] = None
        self._use_dynamic_zones = use_dynamic_zones
        self._cache_ttl = timedelta(hours=cache_ttl_hours)
        self._last_refresh: Optional[datetime] = None
        self._dynamic_zones: Optional[List[Zone]] = None

    def _load_zones(self) -> None:
        """
        Load zones from GeoJSON file
        """
        # Get the data directory path
        current_dir = Path(__file__).parent.parent
        zones_file = current_dir / "data" / "zones.geojson"

        if not zones_file.exists():
            raise FileNotFoundError(f"Zones data file not found: {zones_file}")

        # Load the GeoJSON file
        with open(zones_file, "r") as f:
            self._zones_geojson = json.load(f)

        # Parse zones into Zone objects
        self._zones = []
        for feature in self._zones_geojson.get("features", []):
            properties = feature["properties"]
            geometry = feature["geometry"]

            zone = Zone(
                id=feature["id"],
                name=properties["name"],
                coordinates={
                    "lon": geometry["coordinates"][0],
                    "lat": geometry["coordinates"][1]
                },
                audience_signals=properties["audience_signals"],
                timing_windows=properties["timing_windows"],
                dwell_time_seconds=properties["dwell_time_seconds"],
                cost_tier=properties["cost_tier"],
                foot_traffic_daily=properties.get("foot_traffic_daily")
            )
            self._zones.append(zone)

    async def _load_zones_from_database(self) -> bool:
        """
        Load zones from Supabase database

        Returns:
            bool: True if zones were loaded successfully, False otherwise
        """
        try:
            supabase = get_supabase_client()
            logger.info("Loading zones from database...")

            # Query all zones - use latitude/longitude columns (simpler than PostGIS)
            result = supabase.table("zones").select("*").execute()

            if not result.data:
                logger.info("No zones found in database")
                return False

            # Convert database records to Zone objects
            self._dynamic_zones = []
            for record in result.data:
                # Use latitude/longitude columns (added in migration 008)
                lat = record.get("latitude")
                lon = record.get("longitude")

                if lat is None or lon is None:
                    logger.warning(f"Zone {record.get('id')} missing lat/lng - run migration 008")
                    continue

                try:
                    lat = float(lat)
                    lon = float(lon)
                except (ValueError, TypeError):
                    logger.warning(f"Zone {record.get('id')} has invalid coordinates")
                    continue

                zone = Zone(
                    id=record["id"],
                    name=record["name"],
                    coordinates={"lat": lat, "lon": lon},
                    audience_signals=record["audience_signals"],
                    timing_windows=record["timing_windows"],
                    dwell_time_seconds=record["dwell_time_seconds"],
                    cost_tier=record["cost_tier"],
                    foot_traffic_daily=record.get("foot_traffic_daily")
                )
                self._dynamic_zones.append(zone)

            logger.info(f"Loaded {len(self._dynamic_zones)} zones from database")
            return True

        except Exception as e:
            logger.error(f"Error loading zones from database: {e}")
            return False

    async def _save_zones_to_database(self, zones: List[Zone]) -> bool:
        """
        Save zones to Supabase database

        Args:
            zones: List of Zone objects to save

        Returns:
            bool: True if save was successful, False otherwise
        """
        try:
            supabase = get_supabase_client()
            logger.info(f"Saving {len(zones)} zones to database...")

            # Clear existing zones
            supabase.table("zones").delete().neq("id", "").execute()

            # Prepare zone records for database
            records = []
            for zone in zones:
                lon = zone.coordinates["lon"]
                lat = zone.coordinates["lat"]

                # Store coordinates in both formats for compatibility
                location_wkt = f"POINT({lon} {lat})"  # PostGIS format (for backwards compat)

                record = {
                    "id": zone.id,
                    "name": zone.name,
                    "location": location_wkt,
                    "latitude": lat,  # Separate columns for easy querying
                    "longitude": lon,
                    "audience_signals": zone.audience_signals,
                    "timing_windows": zone.timing_windows,
                    "dwell_time_seconds": zone.dwell_time_seconds,
                    "cost_tier": zone.cost_tier,
                }

                if zone.foot_traffic_daily:
                    record["foot_traffic_daily"] = zone.foot_traffic_daily

                records.append(record)

            # Batch insert zones
            if records:
                supabase.table("zones").insert(records).execute()
                logger.info(f"Successfully saved {len(records)} zones to database")
                return True
            else:
                logger.warning("No zones to save")
                return False

        except Exception as e:
            logger.error(f"Error saving zones to database: {e}")
            return False

    async def _load_dynamic_zones(self) -> None:
        """
        Load zones dynamically from Google Places + Arlington Parking
        """
        from app.services.data_ingestion import data_ingestion_service

        try:
            logger.info("Loading dynamic zones from Google Places + Arlington Parking...")

            # Generate zones from real data (limit to 30 for API quota)
            zone_dicts = await data_ingestion_service.generate_zones_from_parking_data(limit=30)

            if not zone_dicts:
                logger.warning("No dynamic zones generated, falling back to static zones")
                self._load_zones()  # Fallback to static
                return

            # Convert to Zone objects
            self._dynamic_zones = []
            for zone_dict in zone_dicts:
                zone = Zone(
                    id=zone_dict["id"],
                    name=zone_dict["name"],
                    coordinates=zone_dict["coordinates"],
                    audience_signals=zone_dict["audience_signals"],
                    timing_windows=zone_dict["timing_windows"],
                    dwell_time_seconds=zone_dict["dwell_time_seconds"],
                    cost_tier=zone_dict["cost_tier"],
                    foot_traffic_daily=zone_dict.get("foot_traffic_daily")
                )
                self._dynamic_zones.append(zone)

            self._last_refresh = datetime.now()
            logger.info(f"Loaded {len(self._dynamic_zones)} dynamic zones from APIs")

            # Save zones to database for persistence
            await self._save_zones_to_database(self._dynamic_zones)

        except Exception as e:
            logger.error(f"Error loading dynamic zones: {e}")
            logger.info("Falling back to static zones")
            self._load_zones()  # Fallback to static

    def _is_cache_valid(self) -> bool:
        """
        Check if the dynamic zone cache is still valid
        """
        if not self._last_refresh:
            return False
        return datetime.now() - self._last_refresh < self._cache_ttl

    async def get_all_zones(self) -> List[Zone]:
        """
        Get all zones with database persistence priority

        Loading strategy:
        1. Check memory cache (if valid)
        2. Load from database (instant, no API calls)
        3. Generate from APIs if database is empty or cache expired
        4. Fall back to static zones.geojson if all else fails

        Returns:
            List of Zone objects
        """
        if self._use_dynamic_zones:
            # If we have valid cached zones, return them
            if self._dynamic_zones and self._is_cache_valid():
                return self._dynamic_zones

            # Try loading from database first (fast, no API calls)
            if self._dynamic_zones is None:
                logger.info("No zones in memory, checking database...")
                loaded_from_db = await self._load_zones_from_database()
                if loaded_from_db and self._dynamic_zones:
                    logger.info("Using zones from database")
                    self._last_refresh = datetime.now()
                    return self._dynamic_zones

            # If database is empty or cache expired, refresh from APIs
            if self._dynamic_zones is None or not self._is_cache_valid():
                logger.info("Cache expired or no zones in database, fetching from APIs...")
                await self._load_dynamic_zones()

            # Return dynamic zones if available, otherwise fall back to static
            if self._dynamic_zones:
                return self._dynamic_zones

        # Fall back to static zones
        if self._zones is None:
            self._load_zones()
        return self._zones

    async def refresh_zones(self) -> int:
        """
        Force refresh of dynamic zones from APIs

        Returns:
            Number of zones loaded
        """
        logger.info("Force refreshing zones...")
        self._dynamic_zones = None
        self._last_refresh = None
        await self._load_dynamic_zones()
        return len(self._dynamic_zones) if self._dynamic_zones else 0

    async def import_static_zones_to_database(self) -> int:
        """
        Import static zones from zones.geojson file into database

        This is a one-time migration to populate the database with
        the curated static zones. After this, zones will be managed
        dynamically through API generation.

        Returns:
            Number of zones imported
        """
        logger.info("Importing static zones from zones.geojson to database...")

        try:
            # Load static zones from GeoJSON file
            self._load_zones()

            if not self._zones:
                logger.error("No static zones found in zones.geojson")
                return 0

            # Convert static zones to database format
            supabase = get_supabase_client()

            # Check if database already has zones
            existing = supabase.table("zones").select("id", count="exact").execute()
            if existing.data and len(existing.data) > 0:
                logger.warning(f"Database already has {len(existing.data)} zones")
                logger.info("Use refresh_zones() to update with new data, or manually clear database first")
                return 0

            # Prepare zone records for database
            records = []
            for zone in self._zones:
                lon = zone.coordinates["lon"]
                lat = zone.coordinates["lat"]
                location_wkt = f"POINT({lon} {lat})"

                record = {
                    "id": zone.id,
                    "name": zone.name,
                    "location": location_wkt,
                    "audience_signals": zone.audience_signals,
                    "timing_windows": zone.timing_windows,
                    "dwell_time_seconds": zone.dwell_time_seconds,
                    "cost_tier": zone.cost_tier,
                }

                if zone.foot_traffic_daily:
                    record["foot_traffic_daily"] = zone.foot_traffic_daily

                records.append(record)

            # Batch insert zones
            if records:
                supabase.table("zones").insert(records).execute()
                logger.info(f"Successfully imported {len(records)} static zones to database")

                # Update memory cache
                self._dynamic_zones = self._zones
                self._last_refresh = datetime.now()

                return len(records)
            else:
                logger.warning("No zones to import")
                return 0

        except Exception as e:
            logger.error(f"Error importing static zones to database: {e}")
            raise

    def get_zone_by_id(self, zone_id: str) -> Optional[Zone]:
        """
        Get a single zone by ID

        Args:
            zone_id: Zone identifier

        Returns:
            Zone object or None if not found
        """
        if self._zones is None:
            self._load_zones()

        for zone in self._zones:
            if zone.id == zone_id:
                return zone
        return None

    def get_zones_geojson(self) -> Dict[str, Any]:
        """
        Get raw GeoJSON data (for map visualization)

        Returns:
            GeoJSON FeatureCollection
        """
        if self._zones_geojson is None:
            self._load_zones()
        return self._zones_geojson

    def get_zones_count(self) -> int:
        """
        Get total number of zones

        Returns:
            Number of zones
        """
        if self._zones is None:
            self._load_zones()
        return len(self._zones)


# Global singleton instance
zones_service = ZonesService()
