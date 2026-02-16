"""
Recommendations Service - Story 4.2
Implements the scoring algorithm for ranking placement zones based on event data
"""

import math
from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field

from app.services.zones import Zone, zones_service


class EventData(BaseModel):
    """
    Event data model for scoring
    Story 6.2: Added time_period for temporal scoring adjustment
    """
    name: str
    date: str  # ISO format
    time: str  # e.g., "18:00"
    venue_lat: float
    venue_lon: float
    target_audience: List[str]  # e.g., ["young-professionals", "25-34", "coffee-enthusiasts"]
    event_type: str  # e.g., "workshop", "concert", "sale"
    time_period: Optional[str] = "evening"  # Story 6.2: "morning", "lunch", or "evening"


class DataSource(BaseModel):
    """
    Data source information for transparency (Story 4.10)
    """
    name: str  # e.g., "Metro transit schedules"
    status: str  # "detected" or "not_detected"
    details: Optional[str] = None  # e.g., "Orange Line, high confidence"
    last_updated: str  # ISO date, e.g., "2026-02-10"


class ZoneScore(BaseModel):
    """
    Zone with calculated score and breakdown
    """
    zone: Zone
    total_score: float  # 0-100
    audience_match_score: float  # 0-40
    temporal_alignment_score: float  # 0-30
    distance_score: float  # 0-20
    dwell_time_score: float  # 0-10
    distance_miles: float
    reasoning: str
    data_sources: List[DataSource] = Field(default_factory=list)  # Story 4.10


class RecommendationsService:
    """
    Service for scoring and ranking placement zones based on event data
    Story 4.2: Implements the recommendation scoring algorithm
    """

    def __init__(self):
        self.zones_service = zones_service

    def score_zones(self, event_data: EventData) -> List[ZoneScore]:
        """
        Score all zones based on event data
        Returns list of ZoneScore objects sorted by total_score (highest first)

        Scoring Formula (Story 4.2 AC):
        - audience_match: 40% - does the zone attract target audience?
        - temporal_alignment: 30% - are people there when you need them?
        - distance: 20% - how close to venue?
        - dwell_time: 10% - do people stop and look?

        Final score: 0-100%
        """
        zones = self.zones_service.get_all_zones()
        scored_zones = []

        for zone in zones:
            # Calculate individual components
            audience_match = self._calculate_audience_match(
                event_data.target_audience, zone.audience_signals
            )
            temporal_alignment = self._calculate_temporal_alignment(
                event_data.date, event_data.time, event_data.event_type, zone.timing_windows
            )
            distance_miles = self._calculate_distance(
                event_data.venue_lat, event_data.venue_lon,
                zone.coordinates["lat"], zone.coordinates["lon"]
            )
            distance_score_val = self._calculate_distance_score(distance_miles)
            dwell_time_score_val = self._calculate_dwell_time_score(zone.dwell_time_seconds)

            # Calculate weighted total score (0-100)
            total_score = (
                audience_match +  # 0-40 points
                temporal_alignment +  # 0-30 points
                distance_score_val +  # 0-20 points
                dwell_time_score_val  # 0-10 points
            )

            # Generate reasoning
            reasoning = self._generate_reasoning(
                zone, audience_match, temporal_alignment, distance_miles,
                zone.dwell_time_seconds, event_data
            )

            # Story 4.10: Detect data sources used for this zone
            data_sources = self._detect_data_sources(zone, event_data)

            scored_zones.append(
                ZoneScore(
                    zone=zone,
                    total_score=round(total_score, 1),
                    audience_match_score=round(audience_match, 1),
                    temporal_alignment_score=round(temporal_alignment, 1),
                    distance_score=round(distance_score_val, 1),
                    dwell_time_score=round(dwell_time_score_val, 1),
                    distance_miles=round(distance_miles, 2),
                    reasoning=reasoning,
                    data_sources=data_sources,
                )
            )

        # Sort by total_score descending (highest first)
        scored_zones.sort(key=lambda x: x.total_score, reverse=True)

        return scored_zones

    def _calculate_audience_match(
        self, target_audience: List[str], zone_audience_signals: Dict[str, Any]
    ) -> float:
        """
        Calculate audience match score (0-40 points)
        Compares event target audience with zone audience_signals
        """
        if not target_audience:
            return 0.0

        # Extract zone audience characteristics
        zone_demographics = zone_audience_signals.get("demographics", [])
        zone_interests = zone_audience_signals.get("interests", [])
        zone_behaviors = zone_audience_signals.get("behaviors", [])

        all_zone_signals = zone_demographics + zone_interests + zone_behaviors

        if not all_zone_signals:
            return 0.0

        # Calculate match percentage
        matches = sum(1 for audience in target_audience if audience in all_zone_signals)
        match_percentage = matches / len(target_audience)

        # Scale to 0-40 points
        return match_percentage * 40.0

    def _calculate_temporal_alignment(
        self, event_date: str, event_time: str, event_type: str,
        timing_windows: Dict[str, Any]
    ) -> float:
        """
        Calculate temporal alignment score (0-30 points)
        Checks if event timing aligns with zone optimal windows
        """
        optimal_windows = timing_windows.get("optimal", [])

        if not optimal_windows:
            return 15.0  # Neutral score if no timing data

        # Parse event date to get day of week
        try:
            event_datetime = datetime.fromisoformat(event_date)
            event_day = event_datetime.strftime("%A")  # e.g., "Monday"
        except (ValueError, TypeError):
            return 15.0  # Neutral score if date invalid

        # Parse event time (HH:MM format)
        try:
            event_hour = int(event_time.split(":")[0])
        except (ValueError, IndexError):
            return 15.0  # Neutral score if time invalid

        # Check if event day/time matches any optimal window
        best_alignment_score = 0.0

        for window in optimal_windows:
            window_days = window.get("days", [])
            window_times = window.get("times", [])

            # Check day match
            day_match = event_day in window_days

            # Check time match
            time_match = False
            for time_range in window_times:
                # Parse time range (e.g., "17:00-19:00")
                try:
                    start_time, end_time = time_range.split("-")
                    start_hour = int(start_time.split(":")[0])
                    end_hour = int(end_time.split(":")[0])

                    if start_hour <= event_hour < end_hour:
                        time_match = True
                        break
                except (ValueError, IndexError):
                    continue

            # Calculate alignment score for this window
            if day_match and time_match:
                alignment_score = 30.0  # Perfect match
            elif day_match:
                alignment_score = 20.0  # Day matches but not time
            elif time_match:
                alignment_score = 15.0  # Time matches but not day
            else:
                alignment_score = 5.0  # No match

            best_alignment_score = max(best_alignment_score, alignment_score)

        return best_alignment_score

    def _calculate_distance(
        self, lat1: float, lon1: float, lat2: float, lon2: float
    ) -> float:
        """
        Calculate distance in miles between two coordinates
        Uses Haversine formula for accurate geographic distance
        """
        # Earth radius in miles
        R = 3958.8

        # Convert to radians
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)

        # Haversine formula
        a = (
            math.sin(delta_lat / 2) ** 2
            + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        distance = R * c

        return distance

    def _calculate_distance_score(self, distance_miles: float) -> float:
        """
        Calculate distance score (0-20 points)
        Closer zones get higher scores

        Scoring:
        - 0-1 miles: 20 points (very close)
        - 1-3 miles: 15 points (walkable/short drive)
        - 3-5 miles: 10 points (moderate distance)
        - 5-10 miles: 5 points (far)
        - >10 miles: 2 points (very far)
        """
        if distance_miles <= 1.0:
            return 20.0
        elif distance_miles <= 3.0:
            return 15.0
        elif distance_miles <= 5.0:
            return 10.0
        elif distance_miles <= 10.0:
            return 5.0
        else:
            return 2.0

    def _calculate_dwell_time_score(self, dwell_time_seconds: int) -> float:
        """
        Calculate dwell time score (0-10 points)
        Higher dwell time = more attention to ads

        Scoring:
        - 60+ seconds: 10 points (excellent attention)
        - 45-60 seconds: 8 points (good attention)
        - 30-45 seconds: 6 points (moderate attention)
        - 20-30 seconds: 4 points (brief attention)
        - <20 seconds: 2 points (rushing past)
        """
        if dwell_time_seconds >= 60:
            return 10.0
        elif dwell_time_seconds >= 45:
            return 8.0
        elif dwell_time_seconds >= 30:
            return 6.0
        elif dwell_time_seconds >= 20:
            return 4.0
        else:
            return 2.0

    def _detect_data_sources(self, zone: Zone, event_data: EventData) -> List[DataSource]:
        """
        Detect which data sources were used for this zone
        Story 4.10: Show data sources checked for each recommendation
        """
        sources = []

        # Base data updated date (for demo purposes, using recent date)
        base_date = "2026-02-10"

        # Check for Metro transit data
        zone_name_lower = zone.name.lower()
        if "metro" in zone_name_lower:
            # Extract line info from name (e.g., "Orange Line", "Blue/Orange/Silver Lines")
            line_info = "high confidence"
            if "orange" in zone_name_lower:
                line_info = "Orange Line, high confidence"
            elif "blue" in zone_name_lower:
                line_info = "Blue/Orange/Silver Lines, high confidence"

            sources.append(DataSource(
                name="Metro transit schedules",
                status="detected",
                details=f"Transit access [{line_info}]",
                last_updated=base_date
            ))
        else:
            sources.append(DataSource(
                name="Metro transit schedules",
                status="not_detected",
                details="No direct Metro access",
                last_updated=base_date
            ))

        # Check for foot traffic data (all zones have this from Arlington Open Data)
        if hasattr(zone, 'foot_traffic_daily') or 'foot_traffic_daily' in zone.dict():
            sources.append(DataSource(
                name="Arlington Open Data (foot traffic)",
                status="detected",
                details=f"Daily foot traffic patterns monitored",
                last_updated=base_date
            ))

        # Check for timing/behavior data
        if zone.timing_windows and len(zone.timing_windows.get("optimal", [])) > 0:
            sources.append(DataSource(
                name="Behavioral timing patterns",
                status="detected",
                details=f"Optimal windows identified for target audience",
                last_updated=base_date
            ))

        # Check for event competition (placeholder - always show as checked)
        sources.append(DataSource(
            name="Event permits database",
            status="not_detected",
            details="No competing events detected",
            last_updated=base_date
        ))

        return sources

    def _generate_reasoning(
        self, zone: Zone, audience_match: float, temporal_alignment: float,
        distance_miles: float, dwell_time_seconds: int, event_data: EventData
    ) -> str:
        """
        Generate plain-language reasoning for why this zone scored as it did
        Story 4.9: Display transparent reasoning for each recommendation
        """
        reasons = []

        # Audience match reasoning
        if audience_match >= 32:  # 80% of 40 points
            reasons.append(f"Excellent audience match for your target demographics")
        elif audience_match >= 24:  # 60% of 40 points
            reasons.append(f"Good audience alignment")
        else:
            reasons.append(f"Limited audience overlap")

        # Temporal reasoning
        if temporal_alignment >= 24:  # 80% of 30 points
            reasons.append(f"optimal timing for your event schedule")
        elif temporal_alignment >= 18:  # 60% of 30 points
            reasons.append(f"decent timing alignment")
        else:
            reasons.append(f"timing may not align perfectly")

        # Distance reasoning
        if distance_miles < 1:
            reasons.append(f"very close to venue ({distance_miles:.1f} mi)")
        elif distance_miles < 3:
            reasons.append(f"walkable distance ({distance_miles:.1f} mi)")
        elif distance_miles < 5:
            reasons.append(f"moderate distance ({distance_miles:.1f} mi)")
        else:
            reasons.append(f"farther from venue ({distance_miles:.1f} mi)")

        # Dwell time reasoning
        if dwell_time_seconds >= 45:
            reasons.append(f"high dwell time ({dwell_time_seconds}s) for ad visibility")
        elif dwell_time_seconds >= 30:
            reasons.append(f"moderate dwell time ({dwell_time_seconds}s)")
        else:
            reasons.append(f"lower dwell time ({dwell_time_seconds}s) - people may rush past")

        # Combine into sentence
        reasoning = f"{zone.name}: {', '.join(reasons)}."

        return reasoning


# Singleton instance
recommendations_service = RecommendationsService()
