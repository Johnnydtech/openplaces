"""
Tests for Zones Service and API - Story 4.1
"""

import pytest
from app.services.zones import zones_service, Zone


class TestZonesService:
    """Test the zones service"""

    def test_load_zones(self):
        """Should load zones from GeoJSON file"""
        zones = zones_service.get_all_zones()
        assert zones is not None
        assert isinstance(zones, list)
        assert len(zones) > 0

    def test_zones_count(self):
        """Should return correct count of zones"""
        count = zones_service.get_zones_count()
        assert count >= 20  # Minimum 20 zones per acceptance criteria
        assert count <= 30  # Maximum 30 zones per acceptance criteria

    def test_zone_structure(self):
        """Should have correct zone structure"""
        zones = zones_service.get_all_zones()
        zone = zones[0]

        # Check all required fields from Story 4.1 AC
        assert hasattr(zone, "id")
        assert hasattr(zone, "name")
        assert hasattr(zone, "coordinates")
        assert hasattr(zone, "audience_signals")
        assert hasattr(zone, "timing_windows")
        assert hasattr(zone, "dwell_time_seconds")
        assert hasattr(zone, "cost_tier")

        # Validate coordinate structure
        assert "lat" in zone.coordinates
        assert "lon" in zone.coordinates
        assert isinstance(zone.coordinates["lat"], float)
        assert isinstance(zone.coordinates["lon"], float)

    def test_audience_signals_structure(self):
        """Should have audience signals JSONB structure"""
        zones = zones_service.get_all_zones()
        zone = zones[0]

        assert isinstance(zone.audience_signals, dict)
        # Should contain demographics, interests, behaviors
        assert "demographics" in zone.audience_signals
        assert "interests" in zone.audience_signals
        assert "behaviors" in zone.audience_signals

    def test_timing_windows_structure(self):
        """Should have timing windows JSONB structure"""
        zones = zones_service.get_all_zones()
        zone = zones[0]

        assert isinstance(zone.timing_windows, dict)
        assert "optimal" in zone.timing_windows
        assert isinstance(zone.timing_windows["optimal"], list)
        assert len(zone.timing_windows["optimal"]) > 0

        # Check timing window structure
        window = zone.timing_windows["optimal"][0]
        assert "days" in window
        assert "times" in window
        assert "reasoning" in window

    def test_cost_tier_values(self):
        """Should have valid cost tier values"""
        zones = zones_service.get_all_zones()

        valid_cost_tiers = ["free", "$", "$$", "$$$"]
        for zone in zones:
            assert zone.cost_tier in valid_cost_tiers

    def test_get_zone_by_id(self):
        """Should retrieve zone by ID"""
        # Test with known zone ID from acceptance criteria
        zone = zones_service.get_zone_by_id("ballston-metro")
        assert zone is not None
        assert zone.id == "ballston-metro"
        assert "Ballston Metro" in zone.name

    def test_get_zone_by_id_not_found(self):
        """Should return None for non-existent zone"""
        zone = zones_service.get_zone_by_id("non-existent-zone")
        assert zone is None

    def test_geojson_format(self):
        """Should return valid GeoJSON"""
        geojson = zones_service.get_zones_geojson()

        assert geojson is not None
        assert geojson["type"] == "FeatureCollection"
        assert "features" in geojson
        assert len(geojson["features"]) > 0

        # Check feature structure
        feature = geojson["features"][0]
        assert feature["type"] == "Feature"
        assert "id" in feature
        assert "geometry" in feature
        assert "properties" in feature

        # Check geometry structure
        assert feature["geometry"]["type"] == "Point"
        assert "coordinates" in feature["geometry"]
        assert len(feature["geometry"]["coordinates"]) == 2  # [lon, lat]

    def test_sample_zones_present(self):
        """Should include sample zones from acceptance criteria"""
        zones = zones_service.get_all_zones()
        zone_ids = [zone.id for zone in zones]

        # From Story 4.1 AC: "sample zones include: Ballston Metro, Clarendon Metro,
        # Courthouse gyms, Whole Foods Clarendon, etc."
        assert "ballston-metro" in zone_ids
        assert "clarendon-metro" in zone_ids
        assert "courthouse-gyms" in zone_ids or "courthouse-plaza" in zone_ids
        assert "whole-foods-clarendon" in zone_ids

    def test_arlington_coordinates(self):
        """Should have coordinates within Arlington, VA bounds"""
        zones = zones_service.get_all_zones()

        # Arlington, VA boundaries (approximate)
        ARLINGTON_BOUNDS = {
            "min_lat": 38.82,
            "max_lat": 38.93,
            "min_lon": -77.17,
            "max_lon": -77.03
        }

        for zone in zones:
            lat = zone.coordinates["lat"]
            lon = zone.coordinates["lon"]

            assert ARLINGTON_BOUNDS["min_lat"] <= lat <= ARLINGTON_BOUNDS["max_lat"], \
                f"Zone {zone.id} latitude {lat} outside Arlington bounds"
            assert ARLINGTON_BOUNDS["min_lon"] <= lon <= ARLINGTON_BOUNDS["max_lon"], \
                f"Zone {zone.id} longitude {lon} outside Arlington bounds"

    def test_dwell_time_reasonable(self):
        """Should have reasonable dwell time values"""
        zones = zones_service.get_all_zones()

        for zone in zones:
            # Dwell time should be between 10 seconds and 2 minutes
            assert 10 <= zone.dwell_time_seconds <= 120, \
                f"Zone {zone.id} has unreasonable dwell time: {zone.dwell_time_seconds}"
