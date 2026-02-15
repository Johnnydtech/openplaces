"""
Zones Service - Story 4.1
Handles loading and serving placement zone data for Arlington, VA
"""

import json
import os
from pathlib import Path
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


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
    """

    def __init__(self):
        self._zones: Optional[List[Zone]] = None
        self._zones_geojson: Optional[Dict[str, Any]] = None

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

    def get_all_zones(self) -> List[Zone]:
        """
        Get all zones

        Returns:
            List of Zone objects
        """
        if self._zones is None:
            self._load_zones()
        return self._zones

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
