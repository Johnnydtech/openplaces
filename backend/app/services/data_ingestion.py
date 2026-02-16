"""
Data Ingestion Service
Fetches real data from Arlington Parking API and Google Places API
to generate dynamic zone recommendations
"""

import os
import httpx
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import asyncio

logger = logging.getLogger(__name__)


class DataIngestionService:
    """
    Service for ingesting real data from Arlington and Google APIs
    """

    # Arlington GIS ArcGIS REST API endpoint for parking meters
    ARLINGTON_PARKING_API = "https://services.arcgis.com/4J3o4jUCTOQqBGWO/arcgis/rest/services/Parking_Meter_Points/FeatureServer/0/query"

    def __init__(self):
        self.google_api_key = os.getenv("GOOGLE_PLACES_API_KEY")
        if not self.google_api_key:
            logger.warning("GOOGLE_PLACES_API_KEY not set - Google Places features will be disabled")

    async def fetch_arlington_parking_locations(self) -> List[Dict[str, Any]]:
        """
        Fetch parking meter locations from Arlington's ArcGIS API
        Returns list of parking locations with coordinates
        """
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Query all parking meters in Arlington
                params = {
                    "where": "1=1",  # Get all records
                    "outFields": "*",  # Get all fields
                    "f": "json",  # JSON format
                    "returnGeometry": "true"
                }

                response = await client.get(self.ARLINGTON_PARKING_API, params=params)
                response.raise_for_status()

                data = response.json()

                if "features" not in data:
                    logger.error("No features in Arlington parking API response")
                    return []

                # Parse parking locations
                parking_locations = []
                for feature in data["features"]:
                    try:
                        geometry = feature.get("geometry", {})
                        attributes = feature.get("attributes", {})

                        location = {
                            "id": attributes.get("OBJECTID"),
                            "meter_id": attributes.get("METER_ID"),
                            "block_face_id": attributes.get("BLOCKFACEID"),
                            "street": attributes.get("FULLSTREET"),
                            "metro_area": attributes.get("METROAREA"),
                            "latitude": geometry.get("y"),
                            "longitude": geometry.get("x"),
                            "time_limit": attributes.get("TIMELIMIT"),
                            "rate": attributes.get("RATE"),
                        }

                        if location["latitude"] and location["longitude"]:
                            parking_locations.append(location)

                    except Exception as e:
                        logger.warning(f"Error parsing parking location: {e}")
                        continue

                logger.info(f"Fetched {len(parking_locations)} parking locations from Arlington")
                return parking_locations

        except Exception as e:
            logger.error(f"Error fetching Arlington parking data: {e}")
            return []

    async def fetch_google_places_nearby(
        self, latitude: float, longitude: float, radius: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Fetch nearby venues from Google Places API

        Args:
            latitude: Center point latitude
            longitude: Center point longitude
            radius: Search radius in meters (default 100m)

        Returns:
            List of nearby venues with details
        """
        if not self.google_api_key:
            return []

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
                params = {
                    "location": f"{latitude},{longitude}",
                    "radius": radius,
                    "key": self.google_api_key,
                }

                response = await client.get(url, params=params)
                response.raise_for_status()

                data = response.json()

                if data.get("status") != "OK":
                    logger.warning(f"Google Places API status: {data.get('status')}")
                    return []

                venues = []
                for place in data.get("results", []):
                    venue = {
                        "place_id": place.get("place_id"),
                        "name": place.get("name"),
                        "types": place.get("types", []),
                        "rating": place.get("rating"),
                        "user_ratings_total": place.get("user_ratings_total"),
                        "latitude": place.get("geometry", {}).get("location", {}).get("lat"),
                        "longitude": place.get("geometry", {}).get("location", {}).get("lng"),
                        "vicinity": place.get("vicinity"),
                    }
                    venues.append(venue)

                return venues

        except Exception as e:
            logger.error(f"Error fetching Google Places data: {e}")
            return []

    def infer_audience_signals_from_venue_types(
        self, venue_types: List[str]
    ) -> Dict[str, List[str]]:
        """
        Infer audience signals from Google Places venue types
        Maps venue types to demographics, interests, and behaviors
        """
        demographics = []
        interests = []
        behaviors = []

        # Map venue types to audience characteristics
        type_mapping = {
            # Demographics
            "university": ["students", "young-adults", "18-24"],
            "school": ["families", "parents", "children"],
            "gym": ["fitness-enthusiasts", "health-conscious", "25-44"],
            "bar": ["young-professionals", "nightlife", "21-35"],
            "restaurant": ["foodies", "diners", "all-ages"],
            "cafe": ["coffee-enthusiasts", "remote-workers", "young-professionals"],
            "shopping_mall": ["shoppers", "families", "weekend-visitors"],
            "park": ["families", "outdoor-enthusiasts", "all-ages"],
            "library": ["students", "readers", "seniors", "families"],
            "museum": ["art-enthusiasts", "cultural", "tourists", "families"],
            "movie_theater": ["entertainment-seekers", "families", "date-nights"],

            # Interests
            "transit_station": ["transit", "commuters", "convenience"],
            "subway_station": ["transit", "commuters", "urban"],
            "bus_station": ["transit", "commuters"],
            "store": ["shopping", "retail"],
            "food": ["dining", "food"],
            "health": ["wellness", "health"],
            "entertainment": ["leisure", "entertainment"],

            # Behaviors
            "point_of_interest": ["explorers", "curious"],
        }

        for venue_type in venue_types:
            if venue_type in type_mapping:
                signals = type_mapping[venue_type]
                # Categorize signals
                if any(demo in signals for demo in ["students", "families", "young-professionals"]):
                    demographics.extend([s for s in signals if s in ["students", "families", "young-professionals", "seniors", "children"]])
                if any(interest in signals for interest in ["transit", "shopping", "dining"]):
                    interests.extend([s for s in signals if s in ["transit", "shopping", "dining", "food", "health", "wellness", "entertainment"]])
                if any(behavior in signals for behavior in ["commuters", "explorers"]):
                    behaviors.extend([s for s in signals if s in ["commuters", "explorers", "shoppers", "weekend-visitors"]])

        # Deduplicate
        demographics = list(set(demographics))
        interests = list(set(interests))
        behaviors = list(set(behaviors))

        return {
            "demographics": demographics,
            "interests": interests,
            "behaviors": behaviors,
        }

    async def generate_zones_from_parking_data(
        self, limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Generate placement zones from Arlington parking data + Google Places

        Args:
            limit: Maximum number of zones to generate

        Returns:
            List of zone dictionaries ready for storage
        """
        logger.info("Starting zone generation from real data...")

        # Step 1: Fetch parking locations
        parking_locations = await self.fetch_arlington_parking_locations()

        if not parking_locations:
            logger.error("No parking locations fetched - cannot generate zones")
            return []

        # Limit to first N locations for API quota management
        parking_locations = parking_locations[:limit]

        # Step 2: For each parking location, get nearby venues
        zones = []

        for parking in parking_locations:
            try:
                # Fetch nearby venues from Google Places
                venues = await self.fetch_google_places_nearby(
                    parking["latitude"],
                    parking["longitude"],
                    radius=100  # 100m radius
                )

                if not venues:
                    continue

                # Aggregate venue types to infer audience
                all_venue_types = []
                for venue in venues:
                    all_venue_types.extend(venue.get("types", []))

                # Infer audience signals from venue types
                audience_signals = self.infer_audience_signals_from_venue_types(all_venue_types)

                # If no meaningful audience signals, skip this zone
                if not any([audience_signals["demographics"], audience_signals["interests"], audience_signals["behaviors"]]):
                    continue

                # Create zone
                zone = {
                    "id": f"parking-{parking['meter_id'] or parking['id']}",
                    "name": f"{parking['street']} - {parking['metro_area'] or 'Arlington'}",
                    "coordinates": {
                        "lat": parking["latitude"],
                        "lon": parking["longitude"]
                    },
                    "audience_signals": audience_signals,
                    "timing_windows": {
                        "optimal": [
                            {
                                "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                                "times": ["17:00-19:00"],
                                "reasoning": "High parking activity during evening commute"
                            }
                        ]
                    },
                    "dwell_time_seconds": 30,  # Default estimate
                    "cost_tier": self._estimate_cost_tier(parking["rate"]),
                    "foot_traffic_daily": 1000,  # Default estimate
                }

                zones.append(zone)

                # Rate limit: Small delay between Google API calls
                await asyncio.sleep(0.1)

            except Exception as e:
                logger.error(f"Error processing parking location {parking.get('id')}: {e}")
                continue

        logger.info(f"Generated {len(zones)} zones from real data")
        return zones

    def _estimate_cost_tier(self, rate: Optional[str]) -> str:
        """
        Estimate cost tier based on parking rate
        """
        if not rate:
            return "$$"

        try:
            # Parse rate (e.g., "$2.00/hr")
            rate_value = float(rate.replace("$", "").split("/")[0])

            if rate_value < 1.5:
                return "$"
            elif rate_value < 2.5:
                return "$$"
            else:
                return "$$$"
        except:
            return "$$"


# Singleton instance
data_ingestion_service = DataIngestionService()
