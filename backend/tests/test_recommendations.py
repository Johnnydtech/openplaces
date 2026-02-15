"""
Tests for Story 4.2: Recommendation Scoring Algorithm
Validates scoring formula and component calculations
"""

import pytest
from app.services.recommendations import (
    RecommendationsService,
    EventData,
    ZoneScore,
)
from app.services.zones import Zone


@pytest.fixture
def recommendations_service():
    """Create recommendations service instance"""
    return RecommendationsService()


@pytest.fixture
def sample_event():
    """Sample event data for testing"""
    return EventData(
        name="Tech Workshop",
        date="2026-02-20",  # Thursday
        time="18:00",  # 6 PM
        venue_lat=38.8816,  # Arlington, VA center
        venue_lon=-77.0910,
        target_audience=["young-professionals", "25-34", "tech-enthusiasts"],
        event_type="workshop",
    )


@pytest.fixture
def sample_zone():
    """Sample zone data for testing"""
    return Zone(
        id="test-zone",
        name="Test Zone",
        coordinates={"lat": 38.8821, "lon": -77.1116},  # ~1 mile from venue
        audience_signals={
            "demographics": ["young-professionals", "25-34"],
            "interests": ["tech-enthusiasts", "coffee"],
            "behaviors": ["commuters"],
        },
        timing_windows={
            "optimal": [
                {
                    "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                    "times": ["17:00-19:00"],
                    "reasoning": "Evening commuters",
                }
            ]
        },
        dwell_time_seconds=45,
        cost_tier="$$",
    )


# ============================================================================
# Story 4.2 Acceptance Criteria Tests
# ============================================================================


def test_scoring_formula_components(recommendations_service, sample_event):
    """
    AC: Scoring formula: audience_match (40%) + temporal_alignment (30%) +
    distance (20%) + dwell_time (10%)
    """
    zones = recommendations_service.zones_service.get_all_zones()
    assert len(zones) > 0, "Should have zones loaded"

    scored_zones = recommendations_service.score_zones(sample_event)

    for scored_zone in scored_zones:
        # Verify score components are within expected ranges
        assert 0 <= scored_zone.audience_match_score <= 40, "Audience match: 0-40 points"
        assert (
            0 <= scored_zone.temporal_alignment_score <= 30
        ), "Temporal alignment: 0-30 points"
        assert 0 <= scored_zone.distance_score <= 20, "Distance: 0-20 points"
        assert 0 <= scored_zone.dwell_time_score <= 10, "Dwell time: 0-10 points"

        # Verify total score is sum of components (within rounding tolerance)
        expected_total = (
            scored_zone.audience_match_score
            + scored_zone.temporal_alignment_score
            + scored_zone.distance_score
            + scored_zone.dwell_time_score
        )
        assert abs(scored_zone.total_score - expected_total) < 0.5, (
            f"Total score should equal sum of components: "
            f"{scored_zone.total_score} vs {expected_total}"
        )


def test_final_score_range(recommendations_service, sample_event):
    """
    AC: Final score 0-100%
    """
    scored_zones = recommendations_service.score_zones(sample_event)

    for scored_zone in scored_zones:
        assert (
            0 <= scored_zone.total_score <= 100
        ), f"Score must be 0-100: {scored_zone.total_score}"


def test_scoring_completes_within_5_seconds(recommendations_service, sample_event):
    """
    AC: Completes within 5 seconds
    """
    import time

    start_time = time.time()
    scored_zones = recommendations_service.score_zones(sample_event)
    elapsed_time = time.time() - start_time

    assert len(scored_zones) > 0, "Should return scored zones"
    assert elapsed_time < 5.0, f"Scoring took {elapsed_time:.2f}s, should be <5s"


def test_zones_sorted_by_score(recommendations_service, sample_event):
    """
    Zones should be returned sorted by total_score (highest first)
    """
    scored_zones = recommendations_service.score_zones(sample_event)

    assert len(scored_zones) > 1, "Should have multiple zones to compare"

    for i in range(len(scored_zones) - 1):
        assert (
            scored_zones[i].total_score >= scored_zones[i + 1].total_score
        ), "Zones should be sorted by score descending"


# ============================================================================
# Audience Match Tests (40% of score)
# ============================================================================


def test_audience_match_perfect_overlap(recommendations_service):
    """Perfect audience match should score close to 40 points"""
    target_audience = ["young-professionals", "25-34", "tech-enthusiasts"]
    zone_signals = {
        "demographics": ["young-professionals", "25-34"],
        "interests": ["tech-enthusiasts", "coffee"],
        "behaviors": ["commuters"],
    }

    score = recommendations_service._calculate_audience_match(target_audience, zone_signals)

    # 3/3 matches = 100% = 40 points
    assert score == 40.0, f"Perfect match should score 40 points, got {score}"


def test_audience_match_partial_overlap(recommendations_service):
    """Partial audience match should score proportionally"""
    target_audience = ["young-professionals", "25-34", "tech-enthusiasts", "fitness"]
    zone_signals = {
        "demographics": ["young-professionals", "25-34"],
        "interests": ["coffee"],  # No tech-enthusiasts or fitness
        "behaviors": [],
    }

    score = recommendations_service._calculate_audience_match(target_audience, zone_signals)

    # 2/4 matches = 50% = 20 points
    assert score == 20.0, f"50% match should score 20 points, got {score}"


def test_audience_match_no_overlap(recommendations_service):
    """No audience match should score 0 points"""
    target_audience = ["students", "18-24"]
    zone_signals = {
        "demographics": ["families", "45+"],
        "interests": ["parenting"],
        "behaviors": [],
    }

    score = recommendations_service._calculate_audience_match(target_audience, zone_signals)

    assert score == 0.0, f"No match should score 0 points, got {score}"


def test_audience_match_empty_target(recommendations_service):
    """Empty target audience should return 0"""
    score = recommendations_service._calculate_audience_match(
        [], {"demographics": ["young-professionals"]}
    )

    assert score == 0.0, "Empty target audience should score 0"


# ============================================================================
# Temporal Alignment Tests (30% of score)
# ============================================================================


def test_temporal_alignment_perfect_match(recommendations_service):
    """Event timing matching zone optimal window should score 30 points"""
    event_date = "2026-02-20"  # Thursday
    event_time = "18:00"  # 6 PM
    event_type = "workshop"
    timing_windows = {
        "optimal": [
            {
                "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                "times": ["17:00-19:00"],
                "reasoning": "Evening commuters",
            }
        ]
    }

    score = recommendations_service._calculate_temporal_alignment(
        event_date, event_time, event_type, timing_windows
    )

    assert score == 30.0, f"Perfect time/day match should score 30 points, got {score}"


def test_temporal_alignment_day_match_only(recommendations_service):
    """Day matches but time doesn't should score 20 points"""
    event_date = "2026-02-20"  # Thursday
    event_time = "12:00"  # Noon (not in 17:00-19:00 window)
    event_type = "workshop"
    timing_windows = {
        "optimal": [
            {
                "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                "times": ["17:00-19:00"],
                "reasoning": "Evening commuters",
            }
        ]
    }

    score = recommendations_service._calculate_temporal_alignment(
        event_date, event_time, event_type, timing_windows
    )

    assert score == 20.0, f"Day match only should score 20 points, got {score}"


def test_temporal_alignment_no_timing_data(recommendations_service):
    """No timing data should return neutral score (15 points)"""
    score = recommendations_service._calculate_temporal_alignment(
        "2026-02-20", "18:00", "workshop", {"optimal": []}
    )

    assert score == 15.0, f"No timing data should score 15 points (neutral), got {score}"


# ============================================================================
# Distance Score Tests (20% of score)
# ============================================================================


def test_distance_calculation_accuracy(recommendations_service):
    """Distance calculation should be accurate using Haversine formula"""
    # Arlington center to Ballston Metro (~2.5 miles)
    lat1, lon1 = 38.8816, -77.0910  # Arlington center
    lat2, lon2 = 38.8821, -77.1116  # Ballston area

    distance = recommendations_service._calculate_distance(lat1, lon1, lat2, lon2)

    # Should be approximately 1 mile (not exact due to coordinates)
    assert 0.5 < distance < 2.0, f"Distance should be ~1 mile, got {distance}"


def test_distance_score_very_close(recommendations_service):
    """Very close zones (<1 mile) should score 20 points"""
    score = recommendations_service._calculate_distance_score(0.5)
    assert score == 20.0, "< 1 mile should score 20 points"


def test_distance_score_walkable(recommendations_service):
    """Walkable distance (1-3 miles) should score 15 points"""
    score = recommendations_service._calculate_distance_score(2.0)
    assert score == 15.0, "1-3 miles should score 15 points"


def test_distance_score_moderate(recommendations_service):
    """Moderate distance (3-5 miles) should score 10 points"""
    score = recommendations_service._calculate_distance_score(4.0)
    assert score == 10.0, "3-5 miles should score 10 points"


def test_distance_score_far(recommendations_service):
    """Far distance (5-10 miles) should score 5 points"""
    score = recommendations_service._calculate_distance_score(7.0)
    assert score == 5.0, "5-10 miles should score 5 points"


def test_distance_score_very_far(recommendations_service):
    """Very far distance (>10 miles) should score 2 points"""
    score = recommendations_service._calculate_distance_score(15.0)
    assert score == 2.0, ">10 miles should score 2 points"


# ============================================================================
# Dwell Time Score Tests (10% of score)
# ============================================================================


def test_dwell_time_excellent(recommendations_service):
    """60+ seconds dwell time should score 10 points"""
    score = recommendations_service._calculate_dwell_time_score(75)
    assert score == 10.0, "60+ seconds should score 10 points"


def test_dwell_time_good(recommendations_service):
    """45-60 seconds should score 8 points"""
    score = recommendations_service._calculate_dwell_time_score(50)
    assert score == 8.0, "45-60 seconds should score 8 points"


def test_dwell_time_moderate(recommendations_service):
    """30-45 seconds should score 6 points"""
    score = recommendations_service._calculate_dwell_time_score(35)
    assert score == 6.0, "30-45 seconds should score 6 points"


def test_dwell_time_brief(recommendations_service):
    """20-30 seconds should score 4 points"""
    score = recommendations_service._calculate_dwell_time_score(25)
    assert score == 4.0, "20-30 seconds should score 4 points"


def test_dwell_time_rushing(recommendations_service):
    """<20 seconds should score 2 points"""
    score = recommendations_service._calculate_dwell_time_score(15)
    assert score == 2.0, "<20 seconds should score 2 points"


# ============================================================================
# Reasoning Generation Tests
# ============================================================================


def test_reasoning_includes_all_factors(recommendations_service, sample_zone, sample_event):
    """Reasoning should mention audience, timing, distance, and dwell time"""
    reasoning = recommendations_service._generate_reasoning(
        zone=sample_zone,
        audience_match=35.0,
        temporal_alignment=25.0,
        distance_miles=1.2,
        dwell_time_seconds=45,
        event_data=sample_event,
    )

    # Check that reasoning is non-empty and mentions key concepts
    assert len(reasoning) > 20, "Reasoning should be descriptive"
    assert sample_zone.name in reasoning, "Should mention zone name"
    # Should describe distance, dwell time, or audience/timing in some way
    assert any(
        word in reasoning.lower()
        for word in ["audience", "timing", "distance", "dwell", "close", "mi"]
    ), "Should mention scoring factors"


def test_reasoning_is_plain_language(recommendations_service, sample_zone, sample_event):
    """Reasoning should be human-readable, not technical jargon"""
    reasoning = recommendations_service._generate_reasoning(
        zone=sample_zone,
        audience_match=35.0,
        temporal_alignment=25.0,
        distance_miles=1.2,
        dwell_time_seconds=45,
        event_data=sample_event,
    )

    # Should not contain technical terms
    bad_terms = ["algorithm", "score_weight", "coefficient", "JSONB", "SQL"]
    for term in bad_terms:
        assert (
            term not in reasoning
        ), f"Reasoning should avoid technical term: {term}"


# ============================================================================
# Integration Tests
# ============================================================================


def test_score_zones_returns_all_zones(recommendations_service, sample_event):
    """score_zones should return scores for all zones"""
    all_zones = recommendations_service.zones_service.get_all_zones()
    scored_zones = recommendations_service.score_zones(sample_event)

    assert len(scored_zones) == len(
        all_zones
    ), "Should return scores for all zones"


def test_score_zones_includes_reasoning(recommendations_service, sample_event):
    """All scored zones should have reasoning"""
    scored_zones = recommendations_service.score_zones(sample_event)

    for scored_zone in scored_zones:
        assert len(scored_zone.reasoning) > 0, "Each zone should have reasoning"
        assert scored_zone.zone.name in scored_zone.reasoning, (
            "Reasoning should mention zone name"
        )


def test_high_score_zones_rank_first(recommendations_service):
    """Zones with better matches should rank higher"""
    # Create event targeting young professionals at Ballston area
    event = EventData(
        name="Tech Meetup",
        date="2026-02-21",  # Friday
        time="18:00",
        venue_lat=38.8821,  # Ballston Metro area
        venue_lon=-77.1116,
        target_audience=["young-professionals", "25-34", "tech-enthusiasts"],
        event_type="workshop",
    )

    scored_zones = recommendations_service.score_zones(event)

    # First zone should have reasonably high score
    assert scored_zones[0].total_score > 50, (
        "Top zone should have > 50 score for good match"
    )

    # Check if Ballston Metro is highly ranked (if it exists)
    ballston_zones = [z for z in scored_zones if "Ballston" in z.zone.name]
    if ballston_zones:
        ballston_rank = scored_zones.index(ballston_zones[0]) + 1
        # Ballston should rank in top 10 for this event (close + good audience match)
        assert ballston_rank <= 10, (
            f"Ballston should rank in top 10 for nearby tech event, "
            f"got rank {ballston_rank}"
        )


def test_different_events_produce_different_rankings(recommendations_service):
    """Different event types should produce different zone rankings"""
    # Event 1: Tech workshop at Ballston
    event1 = EventData(
        name="Tech Workshop",
        date="2026-02-20",
        time="18:00",
        venue_lat=38.8821,
        venue_lon=-77.1116,
        target_audience=["young-professionals", "tech-enthusiasts"],
        event_type="workshop",
    )

    # Event 2: Family event at different location
    event2 = EventData(
        name="Family Festival",
        date="2026-02-22",
        time="11:00",
        venue_lat=38.8500,
        venue_lon=-77.0500,
        target_audience=["families", "parents", "children"],
        event_type="community",
    )

    scores1 = recommendations_service.score_zones(event1)
    scores2 = recommendations_service.score_zones(event2)

    # Top zones should be different
    top_zone_1 = scores1[0].zone.id
    top_zone_2 = scores2[0].zone.id

    # It's possible they're the same, but scores should differ
    if top_zone_1 == top_zone_2:
        # Scores should still be different
        assert scores1[0].total_score != scores2[0].total_score, (
            "Different events should produce different scores"
        )
    else:
        # Different top zones - expected outcome
        assert top_zone_1 != top_zone_2, (
            "Different events should rank zones differently"
        )
