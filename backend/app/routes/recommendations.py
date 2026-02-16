"""
Recommendations API Routes - Story 4.2 & 4.3
Provides endpoints for zone scoring and recommendations
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import logging
import asyncio

from app.services.recommendations import (
    recommendations_service,
    EventData,
    ZoneScore,
    DataSource,
)
from app.services.analytics import analytics_service

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])


class TimingWindowResponse(BaseModel):
    """Frontend-compatible timing window"""
    days: str  # e.g., "Mon-Thu"
    hours: str  # e.g., "5-7pm"
    reasoning: str


class DataSourceResponse(BaseModel):
    """Data source information for transparency (Story 4.10)"""
    name: str
    status: str  # "detected" or "not_detected"
    details: Optional[str] = None
    last_updated: str


class AnalyticsMetrics(BaseModel):
    """Analytics metrics for a zone"""
    average_hourly_audience: int
    peak_hour_audience: int
    total_daily_traffic: int


class HourlyTraffic(BaseModel):
    """Hourly traffic data point"""
    hour: str
    traffic: int


class GenderDistribution(BaseModel):
    """Gender distribution data point"""
    name: str
    value: int


class BusiestDay(BaseModel):
    """Busiest day data point"""
    day: str
    traffic: int


class Analytics(BaseModel):
    """Complete analytics data for a zone"""
    hourly_traffic: List[HourlyTraffic]
    gender_distribution: List[GenderDistribution]
    busiest_days: List[BusiestDay]
    metrics: AnalyticsMetrics


class ZoneRecommendationResponse(BaseModel):
    """
    Flattened zone recommendation response matching frontend TypeScript interface
    """
    zone_id: str
    zone_name: str
    total_score: float  # 0-100

    # Scoring breakdown
    audience_match_score: float  # 0-40
    temporal_score: float  # 0-30
    distance_score: float  # 0-20
    dwell_time_score: float  # 0-10

    # Zone details
    distance_miles: float
    timing_windows: List[TimingWindowResponse]
    dwell_time_seconds: int
    cost_tier: str

    # Transparency features
    reasoning: str
    matched_signals: List[str]
    data_sources: List[DataSourceResponse]  # Story 4.10

    # Geographic data
    latitude: float
    longitude: float

    # Analytics data
    analytics: Optional[Analytics] = None


def _format_timing_windows(timing_windows_dict: Dict[str, Any]) -> List[TimingWindowResponse]:
    """Convert backend timing windows to frontend format"""
    optimal = timing_windows_dict.get("optimal", [])
    formatted = []

    for window in optimal:
        # Convert days list to range string
        days_list = window.get("days", [])
        if days_list:
            # Simplify day ranges (e.g., Mon-Fri)
            if len(days_list) == 5 and "Monday" in days_list and "Friday" in days_list:
                days_str = "Mon-Fri"
            elif len(days_list) >= 2:
                days_str = f"{days_list[0][:3]}-{days_list[-1][:3]}"
            else:
                days_str = days_list[0][:3]
        else:
            days_str = "Any day"

        # Convert times list to range string
        times_list = window.get("times", [])
        hours_str = "Any time"
        if times_list:
            # Convert 24h to 12h format (e.g., "17:00-19:00" -> "5-7pm")
            time_range = times_list[0]  # e.g., "17:00-19:00"
            if "-" in time_range:
                start, end = time_range.split("-")
                start_hour = int(start.split(":")[0])
                end_hour = int(end.split(":")[0])

                # Format to 12h
                start_12h = f"{start_hour % 12 or 12}"
                end_12h = f"{end_hour % 12 or 12}"
                period = "pm" if end_hour >= 12 else "am"
                hours_str = f"{start_12h}-{end_12h}{period}"

        formatted.append(TimingWindowResponse(
            days=days_str,
            hours=hours_str,
            reasoning=window.get("reasoning", "")
        ))

    return formatted


async def _zone_score_to_response(zone_score: ZoneScore) -> ZoneRecommendationResponse:
    """Convert internal ZoneScore to frontend-compatible response"""
    zone = zone_score.zone

    # Convert data sources to response format (Story 4.10)
    data_sources_response = [
        DataSourceResponse(
            name=ds.name,
            status=ds.status,
            details=ds.details,
            last_updated=ds.last_updated
        )
        for ds in zone_score.data_sources
    ]

    # Generate analytics data based on zone location and audience signals
    venue_types = []
    if "demographics" in zone.audience_signals:
        # Infer venue types from demographics
        demographics = zone.audience_signals["demographics"]
        if "students" in demographics or "young-adults" in demographics:
            venue_types.append("cafe")
        if "families" in demographics:
            venue_types.append("park")
        if "young-professionals" in demographics:
            venue_types.append("restaurant")

    if not venue_types:
        venue_types = ["default"]

    analytics_data = await analytics_service.generate_zone_analytics(
        zone.coordinates["lat"],
        zone.coordinates["lon"],
        venue_types
    )

    # Convert to response models
    analytics = Analytics(
        hourly_traffic=[HourlyTraffic(**ht) for ht in analytics_data["hourly_traffic"]],
        gender_distribution=[GenderDistribution(**gd) for gd in analytics_data["gender_distribution"]],
        busiest_days=[BusiestDay(**bd) for bd in analytics_data["busiest_days"]],
        metrics=AnalyticsMetrics(**analytics_data["metrics"])
    )

    return ZoneRecommendationResponse(
        zone_id=zone.id,
        zone_name=zone.name,
        total_score=zone_score.total_score,
        audience_match_score=zone_score.audience_match_score,
        temporal_score=zone_score.temporal_alignment_score,
        distance_score=zone_score.distance_score,
        dwell_time_score=zone_score.dwell_time_score,
        distance_miles=zone_score.distance_miles,
        timing_windows=_format_timing_windows(zone.timing_windows),
        dwell_time_seconds=zone.dwell_time_seconds,
        cost_tier=zone.cost_tier,
        reasoning=zone_score.reasoning,
        matched_signals=[],  # TODO: Calculate from audience match
        data_sources=data_sources_response,
        latitude=zone.coordinates["lat"],
        longitude=zone.coordinates["lon"],
        analytics=analytics,
    )


@router.post("/score", response_model=List[ZoneRecommendationResponse])
async def score_zones(event_data: EventData):
    """
    Score all zones based on event data and return ranked list

    Story 4.2 AC:
    - Scoring formula: audience_match (40%) + temporal_alignment (30%) +
      distance (20%) + dwell_time (10%)
    - Returns zones sorted by score (highest first)
    - Final score 0-100%
    - Completes within 5 seconds

    Story 4.3 AC:
    - Returns top 10 ranked zones
    - Each shows: rank badge, zone name, audience match %, distance, timing windows
    - Sorted by score (highest first)
    """
    try:
        logger.info(
            f"Scoring zones for event: {event_data.name} "
            f"at ({event_data.venue_lat}, {event_data.venue_lon})"
        )

        # Score all zones
        scored_zones = recommendations_service.score_zones(event_data)

        logger.info(
            f"Scored {len(scored_zones)} zones. "
            f"Top score: {scored_zones[0].total_score if scored_zones else 0}"
        )

        # Convert to frontend-compatible format (with analytics)
        responses = await asyncio.gather(
            *[_zone_score_to_response(zone_score) for zone_score in scored_zones]
        )
        return responses

    except Exception as e:
        logger.error(f"Error scoring zones: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to score zones: {str(e)}"
        )


@router.post("/top", response_model=List[ZoneRecommendationResponse])
async def get_top_recommendations(
    event_data: EventData, limit: int = Query(default=10, ge=1, le=30)
):
    """
    Get top N zone recommendations for an event

    Story 4.3 AC:
    - Returns top N zones (default 10)
    - Each shows rank, name, audience match %, distance, timing windows
    - Sorted by score (highest first)
    - Fewer than N zones if not enough qualify

    Args:
        event_data: Event details for scoring
        limit: Maximum number of recommendations to return (1-30, default 10)
    """
    try:
        logger.info(
            f"Getting top {limit} recommendations for event: {event_data.name}"
        )

        # Score all zones
        scored_zones = recommendations_service.score_zones(event_data)

        # Return top N
        top_zones = scored_zones[:limit]

        logger.info(f"Returning top {len(top_zones)} recommendations")

        # Convert to frontend-compatible format (with analytics)
        responses = await asyncio.gather(
            *[_zone_score_to_response(zone_score) for zone_score in top_zones]
        )
        return responses

    except Exception as e:
        logger.error(f"Error getting top recommendations: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get recommendations: {str(e)}",
        )


@router.get("/health")
async def recommendations_health():
    """
    Health check for recommendations service
    """
    try:
        # Check if zones service is working
        zones = recommendations_service.zones_service.get_all_zones()
        return {
            "status": "ok",
            "zones_loaded": len(zones),
            "service": "recommendations",
        }
    except Exception as e:
        logger.error(f"Recommendations health check failed: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail=f"Recommendations service unavailable: {str(e)}",
        )
