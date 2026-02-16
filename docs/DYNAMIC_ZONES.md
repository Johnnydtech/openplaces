# Dynamic Zones Implementation

## Overview

OpenPlaces now supports **dynamic zone generation** from real data sources instead of static hardcoded zones.

### Data Sources

1. **Arlington Parking API** - Real parking meter locations across Arlington, VA
2. **Google Places API** - Nearby venues, business types, and foot traffic data

## How It Works

### 1. Zone Generation Flow

```
Arlington Parking API → Get parking locations (lat/lng)
                ↓
Google Places API → Query nearby venues (100m radius)
                ↓
Venue Analysis → Infer audience signals from business types
                ↓
Zone Creation → Generate dynamic placement zones
```

### 2. Caching

- **Cache TTL**: 24 hours (configurable)
- **Auto-refresh**: Zones refresh automatically when cache expires
- **Manual refresh**: Force refresh via API endpoint

### 3. Fallback Behavior

If dynamic zone generation fails (API errors, no data, etc.), the system automatically falls back to static zones from `zones.geojson`.

## API Endpoints

### Check Zone Status
```bash
GET /api/zones/status
```

Returns:
```json
{
  "success": true,
  "dynamic_zones_enabled": true,
  "zone_count": 30,
  "last_refresh": "2026-02-16T14:30:00",
  "cache_valid": true,
  "cache_ttl_hours": 24,
  "using_dynamic_zones": true
}
```

### Force Refresh Zones
```bash
POST /api/zones/refresh
```

Returns:
```json
{
  "success": true,
  "message": "Successfully refreshed 30 zones from Google Places + Arlington Parking",
  "zone_count": 30,
  "timestamp": "2026-02-16T14:35:00"
}
```

**Note**: This endpoint takes 10-30 seconds as it fetches real-time data from multiple APIs.

### Get All Zones
```bash
GET /api/zones
```

Returns current zones (dynamic or static fallback).

## Configuration

### Enable/Disable Dynamic Zones

In `app/services/zones.py`:

```python
# Enable dynamic zones (default)
zones_service = ZonesService(use_dynamic_zones=True, cache_ttl_hours=24)

# Disable dynamic zones (use static only)
zones_service = ZonesService(use_dynamic_zones=False)
```

### Adjust Cache TTL

```python
# Refresh every 12 hours
zones_service = ZonesService(use_dynamic_zones=True, cache_ttl_hours=12)

# Refresh every 48 hours
zones_service = ZonesService(use_dynamic_zones=True, cache_ttl_hours=48)
```

### Limit Zone Count

In `app/services/data_ingestion.py`:

```python
# Generate up to 30 zones (default)
zones = await data_ingestion_service.generate_zones_from_parking_data(limit=30)

# Generate up to 50 zones (more API calls)
zones = await data_ingestion_service.generate_zones_from_parking_data(limit=50)
```

## Required API Keys

### Google Places API

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create or select a project
3. Enable **Places API**
4. Create credentials → API Key
5. Add to `backend/.env`:
   ```bash
   GOOGLE_PLACES_API_KEY=AIzaSy...
   ```

### Verify Arlington Parking API

No API key required - it's a public ArcGIS MapServer endpoint.

Test it:
```bash
curl "https://gis2.arlingtonva.us/arlgis/rest/services/QAlert/QA_Parking_Meters/MapServer/0/query?where=1=1&outFields=*&f=json&returnGeometry=true"
```

## Benefits of Dynamic Zones

### Before (Static)
- ❌ 10 hardcoded zones
- ❌ Manual coordinates (often inaccurate)
- ❌ Generic audience signals
- ❌ No real foot traffic data

### After (Dynamic)
- ✅ 30+ zones from real parking data
- ✅ Accurate coordinates from Arlington GIS
- ✅ Audience inferred from nearby businesses
- ✅ Real venue types and locations

## Zone Quality

Each dynamic zone includes:

- **ID**: `parking-{meter_id}`
- **Name**: `{Street Name} - {Metro Area}`
- **Coordinates**: Exact lat/lng from Arlington Parking API
- **Audience Signals**: Inferred from Google Places venue types
  - Demographics (e.g., "young-professionals", "families")
  - Interests (e.g., "nightlife", "fitness", "dining")
  - Behaviors (e.g., "morning-exercisers", "evening-goers")
- **Timing Windows**: Based on parking activity patterns
- **Cost Tier**: Based on parking meter rates ($, $$, $$$)
- **Foot Traffic**: Estimated from venue density

## Example Dynamic Zone

```json
{
  "id": "parking-12345",
  "name": "Wilson Blvd - Courthouse",
  "coordinates": {
    "lat": 38.8903,
    "lon": -77.0864
  },
  "audience_signals": {
    "demographics": ["young-professionals", "fitness-enthusiasts"],
    "interests": ["health", "wellness", "dining"],
    "behaviors": ["morning-exercisers", "lunch-goers"]
  },
  "timing_windows": {
    "optimal": [{
      "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "times": ["17:00-19:00"],
      "reasoning": "High parking activity during evening commute"
    }]
  },
  "dwell_time_seconds": 30,
  "cost_tier": "$$",
  "foot_traffic_daily": 1000
}
```

## Venue Type → Audience Mapping

The system intelligently maps Google Places venue types to audience signals:

| Venue Types | Audience Signals |
|------------|------------------|
| gym, fitness_center, spa | fitness-enthusiasts, health-conscious |
| bar, night_club, restaurant | nightlife, young-professionals, social |
| cafe, coffee_shop | coffee-enthusiasts, students, remote-workers |
| library, museum, art_gallery | cultural, families, art-enthusiasts |
| park, playground | families, children, outdoor-enthusiasts |
| shopping_mall, clothing_store | shoppers, retail-enthusiasts |
| university, school | students, academic, young-adults |

## Monitoring

### Check Logs

```bash
# Watch zone loading
tail -f backend/logs/app.log | grep "zone"

# Watch API calls
tail -f backend/logs/app.log | grep "Google Places\|Arlington"
```

### Health Check

```bash
curl http://localhost:8000/api/recommendations/health
```

Should return:
```json
{
  "status": "ok",
  "zones_loaded": 30,
  "service": "recommendations"
}
```

## Troubleshooting

### No Dynamic Zones Generated

**Symptom**: `zone_count: 0` or falling back to static zones

**Solutions**:
1. Check Google Places API key is set and valid
2. Verify Arlington Parking API is accessible
3. Check logs for specific error messages:
   ```bash
   tail -100 backend/logs/app.log | grep "Error"
   ```

### Slow Zone Refresh

**Symptom**: `/zones/refresh` takes >60 seconds

**Cause**: Making 30+ Google Places API calls

**Solutions**:
1. Reduce limit: `generate_zones_from_parking_data(limit=20)`
2. Increase batch delays in `data_ingestion.py`
3. Use caching (default 24 hours) instead of frequent refreshes

### Incorrect Coordinates

**Symptom**: Zones appear in wrong locations on map

**Cause**: Arlington Parking API returns (x, y) which is (longitude, latitude)

**Fix**: Already handled in code - we correctly map:
```python
"lat": geometry.get("y"),  # Latitude
"lon": geometry.get("x")   # Longitude
```

## Next Steps

1. ✅ Dynamic zone generation implemented
2. ✅ Google Places integration complete
3. ✅ Coordinate accuracy fixed
4. 🔄 Add Google Places "Popular Times" data for better temporal scoring
5. 🔄 Add demographic data from census API
6. 🔄 Machine learning for audience signal prediction

## Testing

### Manual Test Flow

1. Start backend:
   ```bash
   cd backend
   python -m uvicorn app.main:app --reload
   ```

2. Check zone status:
   ```bash
   curl http://localhost:8000/api/zones/status
   ```

3. Force refresh (if needed):
   ```bash
   curl -X POST http://localhost:8000/api/zones/refresh
   ```

4. Upload a flyer in the frontend
5. Verify recommendations show dynamic zones
6. Check zone names/locations on map for accuracy

### Expected Results

- Zone names should match real Arlington streets
- Coordinates should place markers at actual parking locations
- Audience signals should make sense for the area
- 20-30 zones should be generated (depending on API data)
