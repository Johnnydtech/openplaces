#!/usr/bin/env python3
"""
Test script to verify API transformation layer works correctly
Validates that backend response matches frontend TypeScript interface
"""

import sys
import json
from app.services.recommendations import recommendations_service, EventData
from app.routes.recommendations import _zone_score_to_response, _format_timing_windows

def test_api_transformation():
    """Test that transformation layer produces frontend-compatible responses"""

    print("🧪 Testing API Transformation Layer\n")
    print("=" * 60)

    # Create test event data
    event_data = EventData(
        name="Coffee Tasting Workshop",
        date="2026-02-22",
        time="14:00",
        venue_lat=38.8816,
        venue_lon=-77.0910,
        target_audience=["coffee-enthusiasts", "young-professionals", "25-34"],
        event_type="workshop"
    )

    print(f"📍 Test Event: {event_data.name}")
    print(f"   Location: ({event_data.venue_lat}, {event_data.venue_lon})")
    print(f"   Audience: {', '.join(event_data.target_audience)}")
    print(f"   Type: {event_data.event_type}\n")

    # Score zones
    print("🔄 Scoring zones...")
    scored_zones = recommendations_service.score_zones(event_data)
    print(f"✅ Scored {len(scored_zones)} zones\n")

    if not scored_zones:
        print("❌ No zones returned!")
        return False

    # Transform top 3 zones
    print("🔀 Transforming to frontend format...")
    top_3 = scored_zones[:3]

    for i, zone_score in enumerate(top_3, 1):
        print(f"\n--- Zone #{i}: {zone_score.zone.name} ---")

        # Transform to response
        response = _zone_score_to_response(zone_score)

        # Validate required fields
        required_fields = [
            'zone_id', 'zone_name', 'total_score',
            'audience_match_score', 'temporal_score', 'distance_score', 'dwell_time_score',
            'distance_miles', 'timing_windows', 'dwell_time_seconds', 'cost_tier',
            'reasoning', 'matched_signals', 'latitude', 'longitude'
        ]

        missing_fields = [field for field in required_fields if not hasattr(response, field)]
        if missing_fields:
            print(f"❌ Missing fields: {missing_fields}")
            return False

        print(f"✅ All required fields present")

        # Validate timing windows format
        if response.timing_windows:
            print(f"   Timing windows: {len(response.timing_windows)}")
            for window in response.timing_windows:
                # Check that days is a string, not a list
                if not isinstance(window.days, str):
                    print(f"❌ timing_windows.days should be string, got {type(window.days)}")
                    return False

                # Check that hours is a string, not a list
                if not isinstance(window.hours, str):
                    print(f"❌ timing_windows.hours should be string, got {type(window.hours)}")
                    return False

                print(f"     • {window.days}, {window.hours}")
                if window.reasoning:
                    print(f"       → {window.reasoning[:60]}...")

        # Validate scores
        if not (0 <= response.total_score <= 100):
            print(f"❌ total_score out of range: {response.total_score}")
            return False

        if not (0 <= response.audience_match_score <= 40):
            print(f"❌ audience_match_score out of range: {response.audience_match_score}")
            return False

        if not (0 <= response.temporal_score <= 30):
            print(f"❌ temporal_score out of range: {response.temporal_score}")
            return False

        if not (0 <= response.distance_score <= 20):
            print(f"❌ distance_score out of range: {response.distance_score}")
            return False

        if not (0 <= response.dwell_time_score <= 10):
            print(f"❌ dwell_time_score out of range: {response.dwell_time_score}")
            return False

        print(f"✅ All scores within valid ranges")

        # Validate geographic data
        if not (-90 <= response.latitude <= 90):
            print(f"❌ Invalid latitude: {response.latitude}")
            return False

        if not (-180 <= response.longitude <= 180):
            print(f"❌ Invalid longitude: {response.longitude}")
            return False

        print(f"✅ Geographic coordinates valid")

        # Show sample data
        print(f"\n   📊 Scores:")
        print(f"      Total: {response.total_score:.1f}")
        print(f"      Audience: {response.audience_match_score:.1f}/40")
        print(f"      Temporal: {response.temporal_score:.1f}/30")
        print(f"      Distance: {response.distance_score:.1f}/20")
        print(f"      Dwell Time: {response.dwell_time_score:.1f}/10")
        print(f"\n   📍 Location: ({response.latitude}, {response.longitude})")
        print(f"   🏷️  Cost Tier: {response.cost_tier}")
        print(f"   📏 Distance: {response.distance_miles:.2f} mi")
        print(f"   ⏱️  Dwell Time: {response.dwell_time_seconds}s")

        if response.reasoning:
            print(f"\n   💡 Reasoning: {response.reasoning[:100]}...")

    print("\n" + "=" * 60)
    print("✅ All transformation tests passed!")
    print("\nFrontend TypeScript interface compatibility verified:")
    print("  ✅ zone_id, zone_name (flat, not nested)")
    print("  ✅ timing_windows with days (string) and hours (string)")
    print("  ✅ latitude, longitude (flat, not in coordinates object)")
    print("  ✅ temporal_score (not temporal_alignment_score)")
    print("  ✅ All scores within valid ranges")

    return True

if __name__ == "__main__":
    try:
        success = test_api_transformation()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
