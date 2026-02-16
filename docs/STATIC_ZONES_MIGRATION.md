# Static Zones Migration Guide

## Overview

Migrate the curated zones from `backend/app/data/zones.geojson` into the Supabase database for persistence.

## Why Migrate?

**Before Migration:**
- ❌ Zones only in GeoJSON file (not persisted)
- ❌ Server restart = 10-30 second API delay
- ❌ Static zones never used (always regenerate from APIs)

**After Migration:**
- ✅ Curated zones persisted in database
- ✅ Instant server restarts (load from database)
- ✅ Can enhance with dynamic API data later

## Static Zones in zones.geojson

The file contains **10 carefully curated zones** for Arlington, VA:

1. **Ballston Metro** - Orange Line (young professionals, commuters)
2. **Clarendon Metro** - Orange Line (nightlife, dining)
3. **Courthouse Fitness District** - Gyms (fitness enthusiasts)
4. **Arlington Central Library** - Library (families, students)
5. **Wilson Boulevard Corridor** - Restaurants (evening traffic)
6. **Lee Highway Commercial** - Shopping (retail, restaurants)
7. **Arlington Farmers Market** - Weekend market (local residents)
8. **Shirlington Village** - Entertainment (families, movie-goers)
9. **Pentagon City Mall** - Shopping center (shoppers, tourists)
10. **Crystal City Metro** - Business district (professionals, lunch crowd)

Each zone has:
- ✅ Accurate coordinates
- ✅ Detailed audience signals (demographics, interests, behaviors)
- ✅ Optimal timing windows (morning, lunch, evening)
- ✅ Dwell time estimates
- ✅ Cost tiers ($, $$, $$$)
- ✅ Foot traffic estimates

## Migration Steps

### Step 1: Run Database Migration

First, ensure the `foot_traffic_daily` column exists:

**Supabase SQL Editor:**
```sql
ALTER TABLE zones
ADD COLUMN IF NOT EXISTS foot_traffic_daily INTEGER;
```

### Step 2: Import Static Zones

**Via API:**
```bash
# Start backend if not running
cd backend
python -m uvicorn app.main:app --reload

# Import zones from zones.geojson to database
curl -X POST http://localhost:8000/api/zones/import-static
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Successfully imported 10 static zones from zones.geojson to database",
  "zone_count": 10,
  "source": "static zones.geojson",
  "next_steps": "Zones are now persisted. You can later refresh with dynamic data using POST /api/zones/refresh"
}
```

### Step 3: Verify Database

**Supabase SQL Editor:**
```sql
-- Check zone count
SELECT COUNT(*) FROM zones;
-- Expected: 10

-- View all zones
SELECT
  id,
  name,
  ST_AsText(location::geometry) as coordinates,
  cost_tier,
  foot_traffic_daily
FROM zones
ORDER BY name;
```

**Expected Output:**
```
id                  | name                              | coordinates                | cost_tier | foot_traffic
--------------------|-----------------------------------|----------------------------|-----------|-------------
ballston-metro      | Ballston Metro - Orange Line     | POINT(-77.1116 38.8821)   | $$        | 8500
clarendon-metro     | Clarendon Metro - Orange Line    | POINT(-77.0947 38.8867)   | $$$       | 12000
courthouse-gyms     | Courthouse Fitness District      | POINT(-77.0864 38.8903)   | $         | 2800
...
```

### Step 4: Test Loading

**Restart Backend:**
```bash
# Ctrl+C to stop
# Then restart
python -m uvicorn app.main:app --reload
```

**Test Zones Endpoint:**
```bash
curl http://localhost:8000/api/zones
# Should return instantly (no API delay)
# Should show 10 zones
```

### Step 5: Upload Flyer & Verify

1. Go to http://localhost:3000
2. Sign in
3. Upload an event flyer
4. Verify recommendations show the 10 zones
5. Check map markers are in correct locations

## API Endpoints

### Import Static Zones
```bash
POST /api/zones/import-static
```

**Behavior:**
- Reads `zones.geojson` file
- Inserts zones into database
- **Safety check**: Only imports if database is empty
- Returns count of imported zones

**Response (Success):**
```json
{
  "success": true,
  "message": "Successfully imported 10 static zones",
  "zone_count": 10,
  "source": "static zones.geojson"
}
```

**Response (Database Already Has Zones):**
```json
{
  "success": false,
  "message": "Database already has zones. Clear database first or use /zones/refresh",
  "zone_count": 0
}
```

### Clear Database Zones
```bash
DELETE /api/zones/clear
```

**WARNING**: This deletes all zones!

**Use Case:**
- Start fresh before re-importing
- Switch from static to dynamic zones
- Clean up test data

**Response:**
```json
{
  "success": true,
  "message": "Cleared 10 zones from database",
  "deleted_count": 10,
  "next_steps": "Import static zones or refresh from APIs"
}
```

### Refresh with Dynamic Zones
```bash
POST /api/zones/refresh
```

**Behavior:**
- Fetches from Google Places + Arlington Parking APIs
- Replaces database zones with dynamic data
- Takes 10-30 seconds

**Use After Migration:**
After importing static zones, you can enhance them with real-time data:
```bash
# Start with 10 curated zones
curl -X POST http://localhost:8000/api/zones/import-static

# Later, enhance with 30+ dynamic zones from APIs
curl -X POST http://localhost:8000/api/zones/refresh
```

## Migration Workflow Options

### Option 1: Static Only (Fast, Curated)
```bash
# 1. Import static zones
curl -X POST http://localhost:8000/api/zones/import-static

# Result: 10 zones, instant loading, curated quality
```

**Pros:**
- ✅ Fast (instant)
- ✅ High quality (manually curated)
- ✅ No API keys needed
- ✅ Predictable results

**Cons:**
- ❌ Only 10 zones (limited coverage)
- ❌ No real-time data

### Option 2: Dynamic Only (Comprehensive, Real-time)
```bash
# 1. Refresh from APIs
curl -X POST http://localhost:8000/api/zones/refresh

# Result: 30+ zones, real data from Google Places
```

**Pros:**
- ✅ 30+ zones (comprehensive coverage)
- ✅ Real venue data
- ✅ Auto-updates daily

**Cons:**
- ❌ Requires API keys
- ❌ 10-30 second initial load
- ❌ Quality varies by API data

### Option 3: Hybrid (Best of Both) ⭐ **Recommended**
```bash
# 1. Start with curated static zones
curl -X POST http://localhost:8000/api/zones/import-static

# 2. Test and verify (10 zones, instant)
curl http://localhost:8000/api/zones

# 3. Later, enhance with dynamic data
curl -X POST http://localhost:8000/api/zones/refresh

# Result: Best of both - starts fast, then enhances with real data
```

**Pros:**
- ✅ Fast initial setup (10 curated zones)
- ✅ Can enhance later with 30+ dynamic zones
- ✅ Fallback to quality static zones if APIs fail

## Troubleshooting

### Import Returns "Database already has zones"

**Cause:** Database is not empty

**Solution:**
```bash
# Check current zones
curl http://localhost:8000/api/zones/status

# Clear database
curl -X DELETE http://localhost:8000/api/zones/clear

# Re-import
curl -X POST http://localhost:8000/api/zones/import-static
```

### Import Fails with "zones.geojson not found"

**Cause:** File missing or path incorrect

**Solution:**
```bash
# Verify file exists
ls -la backend/app/data/zones.geojson

# Check from backend directory
cd backend
ls -la app/data/zones.geojson
```

### Zones Have Wrong Coordinates

**Cause:** PostGIS coordinate order (lon, lat) vs (lat, lon)

**Fix:** Already handled in code
```python
# GeoJSON format: [lon, lat]
"coordinates": [-77.1116, 38.8821]

# Converted to PostGIS: POINT(lon lat)
location_wkt = f"POINT({lon} {lat})"
```

**Verify:**
```sql
-- Should show POINT(lon lat)
SELECT name, ST_AsText(location::geometry) FROM zones LIMIT 1;
-- Result: "POINT(-77.1116 38.8821)"  ✓
```

### Database Shows 0 Zones After Import

**Cause:** Import failed silently

**Solution:**
```bash
# Check backend logs
tail -50 backend/logs/app.log | grep -i "import\|zone"

# Verify Supabase connection
curl http://localhost:8000/api/health

# Check table exists
# In Supabase SQL Editor:
SELECT * FROM zones LIMIT 1;
```

## Data Migration Best Practices

1. **Always backup** before clearing zones:
```sql
-- Backup zones table
CREATE TABLE zones_backup AS SELECT * FROM zones;

-- Restore if needed
INSERT INTO zones SELECT * FROM zones_backup;
```

2. **Test in development** before production

3. **Monitor logs** during import:
```bash
tail -f backend/logs/app.log | grep "zone"
```

4. **Verify data quality** after import:
```sql
-- Check all zones have coordinates
SELECT COUNT(*) FROM zones WHERE location IS NULL;
-- Expected: 0

-- Check all zones have audience data
SELECT COUNT(*) FROM zones
WHERE audience_signals::text = '{}';
-- Expected: 0
```

## Summary

After migration:
- ✅ 10 curated zones persisted in database
- ✅ Instant server restarts (no API delays)
- ✅ Can enhance with 30+ dynamic zones anytime
- ✅ Zones survive server restarts
- ✅ Foundation for production deployment

Next steps:
1. Run migration: `POST /api/zones/import-static`
2. Test frontend with uploaded flyers
3. Optionally enhance with dynamic zones: `POST /api/zones/refresh`
