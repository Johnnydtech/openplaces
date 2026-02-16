-- Migration: Update saved_recommendations to store individual zones (not recommendation sets)
-- Story 2.6-2.9: Users save individual zones from recommendations, not entire recommendation sets
-- Author: Claude Code
-- Date: 2026-02-15

-- Drop the old foreign key constraint to recommendation_id
ALTER TABLE saved_recommendations
DROP CONSTRAINT IF EXISTS saved_recommendations_recommendation_id_fkey;

-- Remove the old unique constraint
ALTER TABLE saved_recommendations
DROP CONSTRAINT IF EXISTS saved_recommendations_user_id_recommendation_id_key;

-- Drop the old recommendation_id column
ALTER TABLE saved_recommendations
DROP COLUMN IF EXISTS recommendation_id;

-- Add new columns for denormalized zone data
ALTER TABLE saved_recommendations
ADD COLUMN IF NOT EXISTS zone_id VARCHAR(255) NOT NULL DEFAULT 'unknown';

ALTER TABLE saved_recommendations
ADD COLUMN IF NOT EXISTS zone_name VARCHAR(255) NOT NULL DEFAULT 'Unknown Zone';

ALTER TABLE saved_recommendations
ADD COLUMN IF NOT EXISTS event_name VARCHAR(255) NOT NULL DEFAULT 'Untitled Event';

ALTER TABLE saved_recommendations
ADD COLUMN IF NOT EXISTS event_date VARCHAR(50) NOT NULL DEFAULT '2026-01-01';

-- Add new unique constraint: user can only save each zone once per event
CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_recommendations_user_zone_event
ON saved_recommendations (user_id, zone_id, event_name, event_date);

-- Update indexes
DROP INDEX IF EXISTS idx_saved_recommendations_user_id;
CREATE INDEX IF NOT EXISTS idx_saved_recommendations_user_id
ON saved_recommendations (user_id);

CREATE INDEX IF NOT EXISTS idx_saved_recommendations_zone_id
ON saved_recommendations (zone_id);

-- Update comment
COMMENT ON TABLE saved_recommendations IS 'User-saved individual zones with event context and custom notes';
COMMENT ON COLUMN saved_recommendations.zone_id IS 'Zone identifier (e.g., zone_1, zone_2)';
COMMENT ON COLUMN saved_recommendations.zone_name IS 'Zone display name (e.g., Ballston Metro)';
COMMENT ON COLUMN saved_recommendations.event_name IS 'Event name for context';
COMMENT ON COLUMN saved_recommendations.event_date IS 'Event date for context';
