-- Change zones.id from UUID to VARCHAR to support string IDs
-- This allows zones to have human-readable IDs like "ballston-metro"

-- Drop foreign key constraints first (if any exist in saved_recommendations)
-- No foreign keys currently reference zones.id, so this is safe

-- Change the id column type
ALTER TABLE zones
ALTER COLUMN id TYPE VARCHAR(255);

-- Update the comment
COMMENT ON COLUMN zones.id IS 'Zone identifier (slug format, e.g., "ballston-metro")';
