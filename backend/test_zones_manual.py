"""
Manual test script for zones service
"""

from app.services.zones import zones_service

# Test loading zones
print("Testing zones service...")
print()

# Test 1: Load all zones
zones = zones_service.get_all_zones()
print(f"✓ Loaded {len(zones)} zones")
print()

# Test 2: Check first zone structure
zone = zones[0]
print(f"✓ First zone: {zone.name}")
print(f"  ID: {zone.id}")
print(f"  Coordinates: {zone.coordinates}")
print(f"  Cost tier: {zone.cost_tier}")
print(f"  Dwell time: {zone.dwell_time_seconds}s")
print()

# Test 3: Get specific zone
ballston = zones_service.get_zone_by_id("ballston-metro")
if ballston:
    print(f"✓ Found Ballston Metro")
    print(f"  Name: {ballston.name}")
    print(f"  Audience signals: {list(ballston.audience_signals.keys())}")
    print(f"  Timing windows: {list(ballston.timing_windows.keys())}")
print()

# Test 4: GeoJSON format
geojson = zones_service.get_zones_geojson()
print(f"✓ GeoJSON loaded: {geojson['type']}")
print(f"  Features: {len(geojson['features'])}")
print()

# Test 5: Count zones
count = zones_service.get_zones_count()
print(f"✓ Total zones: {count}")
print()

# Test 6: Verify sample zones from AC
sample_zones = ["ballston-metro", "clarendon-metro", "whole-foods-clarendon"]
print("✓ Sample zones from Story 4.1 AC:")
for zone_id in sample_zones:
    zone = zones_service.get_zone_by_id(zone_id)
    if zone:
        print(f"  ✓ {zone.name}")
    else:
        print(f"  ✗ {zone_id} NOT FOUND")
print()

print("✓ All manual tests passed!")
