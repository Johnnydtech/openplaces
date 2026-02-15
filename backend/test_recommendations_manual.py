#!/usr/bin/env python3
"""
Manual test script for Story 4.2 - Recommendation Scoring Algorithm
Quick verification that scoring works correctly
"""

import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.recommendations import RecommendationsService, EventData


def main():
    print("=" * 80)
    print("Story 4.2: Recommendation Scoring Algorithm - Manual Test")
    print("=" * 80)

    # Initialize service
    service = RecommendationsService()

    # Create sample event
    event = EventData(
        name="Tech Workshop at Ballston",
        date="2026-02-21",  # Friday
        time="18:00",  # 6 PM
        venue_lat=38.8821,  # Ballston area
        venue_lon=-77.1116,
        target_audience=["young-professionals", "25-34", "tech-enthusiasts"],
        event_type="workshop",
    )

    print(f"\n📋 Event Details:")
    print(f"   Name: {event.name}")
    print(f"   Date: {event.date} at {event.time}")
    print(f"   Venue: ({event.venue_lat}, {event.venue_lon})")
    print(f"   Target Audience: {', '.join(event.target_audience)}")
    print(f"   Event Type: {event.event_type}")

    # Score zones
    print(f"\n🔄 Scoring zones...")
    import time

    start_time = time.time()
    scored_zones = service.score_zones(event)
    elapsed_time = time.time() - start_time

    print(f"✅ Scored {len(scored_zones)} zones in {elapsed_time:.3f} seconds")
    print(f"   Performance: {'✅ PASS' if elapsed_time < 5.0 else '❌ FAIL'} (< 5 seconds)")

    # Display top 10 results
    print(f"\n🏆 Top 10 Recommendations:")
    print("-" * 80)

    for i, zone in enumerate(scored_zones[:10], 1):
        print(f"\n#{i}. {zone.zone.name}")
        print(f"   Total Score: {zone.total_score:.1f}/100")
        print(f"   ├─ Audience Match: {zone.audience_match_score:.1f}/40")
        print(f"   ├─ Timing: {zone.temporal_alignment_score:.1f}/30")
        print(f"   ├─ Distance: {zone.distance_score:.1f}/20 ({zone.distance_miles:.2f} mi)")
        print(f"   └─ Dwell Time: {zone.dwell_time_score:.1f}/10")
        print(f"   💡 Reasoning: {zone.reasoning}")

    # Verify scoring formula
    print(f"\n✅ Verification:")
    print("-" * 80)

    all_valid = True
    for zone in scored_zones:
        # Check score ranges
        if not (0 <= zone.audience_match_score <= 40):
            print(f"❌ Audience match out of range: {zone.audience_match_score}")
            all_valid = False
        if not (0 <= zone.temporal_alignment_score <= 30):
            print(f"❌ Temporal alignment out of range: {zone.temporal_alignment_score}")
            all_valid = False
        if not (0 <= zone.distance_score <= 20):
            print(f"❌ Distance score out of range: {zone.distance_score}")
            all_valid = False
        if not (0 <= zone.dwell_time_score <= 10):
            print(f"❌ Dwell time score out of range: {zone.dwell_time_score}")
            all_valid = False
        if not (0 <= zone.total_score <= 100):
            print(f"❌ Total score out of range: {zone.total_score}")
            all_valid = False

        # Check total is sum of components
        expected_total = (
            zone.audience_match_score
            + zone.temporal_alignment_score
            + zone.distance_score
            + zone.dwell_time_score
        )
        if abs(zone.total_score - expected_total) > 0.5:
            print(
                f"❌ Total score mismatch: {zone.total_score} vs {expected_total}"
            )
            all_valid = False

    if all_valid:
        print("✅ All scoring components valid!")
        print("✅ Score ranges: Audience (0-40), Timing (0-30), Distance (0-20), Dwell (0-10)")
        print("✅ Total score formula: audience + timing + distance + dwell = 0-100")

    # Check sorting
    is_sorted = all(
        scored_zones[i].total_score >= scored_zones[i + 1].total_score
        for i in range(len(scored_zones) - 1)
    )

    print(f"✅ Zones sorted by score: {'✅ PASS' if is_sorted else '❌ FAIL'}")

    # Summary
    print(f"\n" + "=" * 80)
    print(f"📊 Summary:")
    print(f"   Total Zones Scored: {len(scored_zones)}")
    print(f"   Top Score: {scored_zones[0].total_score:.1f}/100 ({scored_zones[0].zone.name})")
    print(f"   Lowest Score: {scored_zones[-1].total_score:.1f}/100 ({scored_zones[-1].zone.name})")
    print(f"   Performance: {elapsed_time:.3f}s (target: < 5s)")
    print(f"   Status: {'✅ ALL TESTS PASSED' if all_valid and is_sorted and elapsed_time < 5.0 else '⚠️  SOME CHECKS FAILED'}")
    print("=" * 80)


if __name__ == "__main__":
    main()
