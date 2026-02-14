# Database Setup Guide

This guide covers setting up the Supabase PostgreSQL database for OpenPlaces.

## Stories Covered
- **Story 1.5**: Initialize Supabase PostgreSQL Database with PostGIS
- **Story 1.6**: Create Database Schema (Users, Zones, Flyers, Recommendations)

## Prerequisites
1. Supabase account created at [supabase.com](https://supabase.com)
2. Project created in Supabase dashboard
3. Environment variables configured in `backend/.env`:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`

## Step 1: Enable PostGIS Extension

In the Supabase SQL Editor, run:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

## Step 2: Create Database Schema

Run the following SQL in the Supabase SQL Editor to create all required tables:

### Users Table
```sql
-- Story 1.6 AC: users (id, clerk_user_id, email)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid()::text = clerk_user_id);
```

### Zones Table
```sql
-- Story 1.6 AC: zones (id, name, location GEOGRAPHY, audience_signals JSONB,
--                      timing_windows JSONB, dwell_time_seconds, cost_tier)
CREATE TABLE IF NOT EXISTS zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    audience_signals JSONB NOT NULL DEFAULT '{}',
    timing_windows JSONB NOT NULL DEFAULT '{}',
    dwell_time_seconds INTEGER NOT NULL DEFAULT 30,
    cost_tier TEXT NOT NULL CHECK (cost_tier IN ('Free', '$', '$$', '$$$')),
    foot_traffic_daily INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Story 1.6 AC: zones location (GIST index)
CREATE INDEX IF NOT EXISTS idx_zones_location ON zones USING GIST(location);

ALTER TABLE zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Zones are viewable by everyone" ON zones
    FOR SELECT USING (true);
```

### Flyer Uploads Table
```sql
-- Story 1.6 AC: flyer_uploads (user_id FK, storage_path, event_data JSONB, expires_at)
CREATE TABLE IF NOT EXISTS flyer_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    event_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Story 1.6 AC: flyer_uploads expires_at index
CREATE INDEX IF NOT EXISTS idx_flyer_uploads_expires_at ON flyer_uploads(expires_at);
CREATE INDEX IF NOT EXISTS idx_flyer_uploads_user_id ON flyer_uploads(user_id);

ALTER TABLE flyer_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own flyer uploads" ON flyer_uploads
    FOR ALL USING (user_id IN (SELECT id FROM users WHERE clerk_user_id = auth.uid()::text));
```

### Recommendations Table
```sql
-- Story 1.6 AC: recommendations (user_id FK, event_hash, event_data JSONB, zones JSONB)
CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_hash TEXT NOT NULL,
    event_data JSONB NOT NULL,
    zones JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days'
);

-- Story 1.6 AC: recommendations user_id/event_hash index
CREATE INDEX IF NOT EXISTS idx_recommendations_user_event
    ON recommendations(user_id, event_hash);
CREATE INDEX IF NOT EXISTS idx_recommendations_expires_at ON recommendations(expires_at);

ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recommendations" ON recommendations
    FOR ALL USING (user_id IN (SELECT id FROM users WHERE clerk_user_id = auth.uid()::text));
```

### Saved Recommendations Table
```sql
-- Story 1.6 AC: saved_recommendations (user_id FK, recommendation_id FK, notes)
CREATE TABLE IF NOT EXISTS saved_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recommendation_id UUID NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, recommendation_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_recommendations_user_id ON saved_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_recommendations_recommendation_id ON saved_recommendations(recommendation_id);

ALTER TABLE saved_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saved recommendations" ON saved_recommendations
    FOR ALL USING (user_id IN (SELECT id FROM users WHERE clerk_user_id = auth.uid()::text));
```

### Helper Functions and Triggers
```sql
-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_zones_updated_at
    BEFORE UPDATE ON zones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_recommendations_updated_at
    BEFORE UPDATE ON saved_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Cleanup functions for expired data
CREATE OR REPLACE FUNCTION cleanup_expired_flyers()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM flyer_uploads WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_expired_recommendations()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM recommendations WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
```

## Step 3: Insert Sample Zones

Run this SQL to populate sample Arlington placement zones (Story 4.1):

```sql
INSERT INTO zones (name, description, location, audience_signals, timing_windows, dwell_time_seconds, cost_tier, foot_traffic_daily)
VALUES
    ('Ballston Metro',
     'Orange Line metro station with high commuter traffic',
     ST_GeogFromText('POINT(-77.1117 38.8816)'),
     '{"young_professionals": true, "commuters": true, "coffee_enthusiasts": true}'::jsonb,
     '{"weekday_evening": {"days": ["Mon-Fri"], "hours": "5-7pm", "reasoning": "Commuters heading home, weekend planning mode"}}'::jsonb,
     45, '$$', 5000),

    ('Clarendon Metro',
     'Orange Line metro with restaurant and bar district',
     ST_GeogFromText('POINT(-77.0956 38.8859)'),
     '{"young_professionals": true, "nightlife": true, "foodies": true}'::jsonb,
     '{"weekday_lunch": {"days": ["Mon-Fri"], "hours": "11am-2pm"}, "evening": {"days": ["Mon-Sun"], "hours": "5-10pm"}}'::jsonb,
     35, '$$', 4500),

    ('Whole Foods Clarendon',
     'High-traffic grocery store in walkable neighborhood',
     ST_GeogFromText('POINT(-77.0942 38.8868)'),
     '{"families": true, "young_professionals": true, "health_conscious": true}'::jsonb,
     '{"weekday_lunch": {"days": ["Mon-Fri"], "hours": "12-2pm"}, "weekend": {"days": ["Sat-Sun"], "hours": "10am-6pm"}}'::jsonb,
     60, '$', 3000),

    ('Courthouse Gyms',
     'Fitness center area near Courthouse metro',
     ST_GeogFromText('POINT(-77.0877 38.8906)'),
     '{"fitness_enthusiasts": true, "young_professionals": true}'::jsonb,
     '{"morning": {"days": ["Mon-Sun"], "hours": "6-9am"}, "evening": {"days": ["Mon-Fri"], "hours": "5-8pm"}}'::jsonb,
     25, '$', 2000),

    ('Rosslyn Metro',
     'Blue/Orange/Silver Line hub with major office buildings',
     ST_GeogFromText('POINT(-77.0719 38.8964)'),
     '{"commuters": true, "young_professionals": true, "office_workers": true}'::jsonb,
     '{"weekday_evening": {"days": ["Mon-Fri"], "hours": "5-7pm", "reasoning": "High volume commuters, repetition builds awareness"}}'::jsonb,
     20, '$$', 7000),

    ('Crystal City Shops',
     'Underground shopping area connected to metro',
     ST_GeogFromText('POINT(-77.0502 38.8574)'),
     '{"commuters": true, "lunch_crowd": true, "office_workers": true}'::jsonb,
     '{"weekday_lunch": {"days": ["Mon-Fri"], "hours": "11am-2pm"}}'::jsonb,
     40, '$$', 4000),

    ('Shirlington Village',
     'Shopping and dining district',
     ST_GeogFromText('POINT(-77.0838 38.8444)'),
     '{"families": true, "weekend_planners": true, "foodies": true}'::jsonb,
     '{"weekend": {"days": ["Sat-Sun"], "hours": "11am-8pm"}}'::jsonb,
     50, '$', 2500),

    ('Pentagon City Mall',
     'Large shopping mall near Pentagon City metro',
     ST_GeogFromText('POINT(-77.0596 38.8629)'),
     '{"shoppers": true, "families": true, "young_professionals": true}'::jsonb,
     '{"weekday_lunch": {"days": ["Mon-Fri"], "hours": "12-2pm"}, "weekend": {"days": ["Sat-Sun"], "hours": "10am-9pm"}}'::jsonb,
     55, '$$$', 6000),

    ('Virginia Square Metro',
     'Metro station near Arlington Arts Center',
     ST_GeogFromText('POINT(-77.1039 38.8814)'),
     '{"students": true, "artists": true, "young_professionals": true}'::jsonb,
     '{"weekday_evening": {"days": ["Mon-Fri"], "hours": "5-7pm"}}'::jsonb,
     30, '$', 2500),

    ('Courthouse Coffee Shops',
     'Cluster of independent coffee shops',
     ST_GeogFromText('POINT(-77.0891 38.8898)'),
     '{"coffee_enthusiasts": true, "remote_workers": true, "students": true}'::jsonb,
     '{"morning": {"days": ["Mon-Sun"], "hours": "7-11am"}, "weekday_lunch": {"days": ["Mon-Fri"], "hours": "12-2pm"}}'::jsonb,
     120, 'Free', 1500)
ON CONFLICT DO NOTHING;
```

## Step 4: Verify Setup

In your backend code, verify the connection:

```python
from app.database import Database

# Verify connection
status = await Database.verify_connection()
print(status)
# Expected: {"connected": True, "postgis_enabled": True, ...}
```

## Acceptance Criteria Verification

### Story 1.5
- [x] Supabase project created with @supabase/supabase-js client
- [x] PostGIS enabled (`CREATE EXTENSION postgis`)
- [x] Backend connects with service key (`SUPABASE_SERVICE_KEY`)
- [x] Connection verified (via `Database.verify_connection()`)

### Story 1.6
- [x] Tables created:
  - `users` (id, clerk_user_id, email)
  - `zones` (id, name, location GEOGRAPHY, audience_signals JSONB, timing_windows JSONB, dwell_time_seconds, cost_tier)
  - `flyer_uploads` (user_id FK, storage_path, event_data JSONB, expires_at)
  - `recommendations` (user_id FK, event_hash, event_data JSONB, zones JSONB)
  - `saved_recommendations` (user_id FK, recommendation_id FK, notes)
- [x] Indexes:
  - zones location (GIST)
  - recommendations user_id/event_hash
  - flyer_uploads expires_at

## Notes

- **Row-Level Security (RLS)**: All tables have RLS enabled for data protection
- **Expiration**: Flyers expire after 7 days, recommendations after 30 days
- **Foreign Keys**: Proper relationships between users, flyers, recommendations
- **Sample Data**: 10 Arlington zones pre-populated for immediate testing

## Maintenance

### Cleanup Expired Data

To manually clean up expired flyers and recommendations:

```sql
SELECT cleanup_expired_flyers();
SELECT cleanup_expired_recommendations();
```

For automated cleanup, set up a Supabase cron job or pg_cron extension.
