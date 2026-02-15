-- Initial Database Schema for OpenPlaces
-- Story 1.6: Create Database Schema (Users, Zones, Flyers, Recommendations)

-- Enable PostGIS extension (run this via Supabase SQL Editor if not already enabled)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users table
-- Links to Clerk authentication via clerk_user_id
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Zones table
-- Physical ad placement locations in Arlington, VA with geospatial data
CREATE TABLE IF NOT EXISTS zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,  -- PostGIS geography type
    audience_signals JSONB NOT NULL DEFAULT '{}',  -- Target audience data
    timing_windows JSONB NOT NULL DEFAULT '{}',   -- Morning/Lunch/Evening optimal times
    dwell_time_seconds INTEGER NOT NULL DEFAULT 0,
    cost_tier VARCHAR(50) NOT NULL DEFAULT 'medium',  -- low, medium, high
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Flyer uploads table
-- Stores uploaded event flyers (images) with expiration
CREATE TABLE IF NOT EXISTS flyer_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    storage_path VARCHAR(500) NOT NULL,
    event_data JSONB NOT NULL DEFAULT '{}',  -- Extracted event details
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL  -- Auto-delete after 7 days
);

-- Recommendations table
-- Cached recommendation results to avoid redundant API calls
CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_hash VARCHAR(64) NOT NULL,  -- SHA-256 hash of event details
    event_data JSONB NOT NULL,
    zones JSONB NOT NULL DEFAULT '[]',  -- Top 10 ranked zones with scores
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Saved recommendations table
-- User-saved recommendations with notes
CREATE TABLE IF NOT EXISTS saved_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recommendation_id UUID NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, recommendation_id)  -- Prevent duplicate saves
);

-- Indexes for performance

-- Zones: Geospatial index for location-based queries
CREATE INDEX IF NOT EXISTS idx_zones_location
ON zones USING GIST (location);

-- Recommendations: User lookup
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id
ON recommendations (user_id);

-- Recommendations: Event hash lookup (for cache hits)
CREATE INDEX IF NOT EXISTS idx_recommendations_event_hash
ON recommendations (event_hash);

-- Recommendations: Combined index for user + event_hash (cache queries)
CREATE INDEX IF NOT EXISTS idx_recommendations_user_event
ON recommendations (user_id, event_hash);

-- Flyer uploads: Expiration cleanup
CREATE INDEX IF NOT EXISTS idx_flyer_uploads_expires_at
ON flyer_uploads (expires_at);

-- Flyer uploads: User lookup
CREATE INDEX IF NOT EXISTS idx_flyer_uploads_user_id
ON flyer_uploads (user_id);

-- Saved recommendations: User lookup
CREATE INDEX IF NOT EXISTS idx_saved_recommendations_user_id
ON saved_recommendations (user_id);

-- Comments for documentation
COMMENT ON TABLE users IS 'User accounts linked to Clerk authentication';
COMMENT ON TABLE zones IS 'Physical ad placement locations in Arlington with geospatial data';
COMMENT ON TABLE flyer_uploads IS 'Event flyer images uploaded by users';
COMMENT ON TABLE recommendations IS 'Cached placement recommendations to avoid redundant API calls';
COMMENT ON TABLE saved_recommendations IS 'User-saved recommendations with custom notes';

COMMENT ON COLUMN zones.location IS 'PostGIS geography point (lat/lon) for distance calculations';
COMMENT ON COLUMN zones.audience_signals IS 'Target audience demographics (age, interests, behaviors)';
COMMENT ON COLUMN zones.timing_windows IS 'Optimal time periods (morning, lunch, evening) with foot traffic data';
COMMENT ON COLUMN recommendations.event_hash IS 'SHA-256 hash of event details for cache lookup';
COMMENT ON COLUMN flyer_uploads.expires_at IS 'Auto-delete after 7 days per privacy policy';
