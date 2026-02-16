-- Add separate lat/lng columns for easier querying
-- PostGIS is powerful but overkill for simple point storage

-- Add latitude and longitude columns
ALTER TABLE zones
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Extract coordinates from existing PostGIS location field
-- Only run this if zones already exist with PostGIS data
UPDATE zones
SET
    longitude = ST_X(location::geometry),
    latitude = ST_Y(location::geometry)
WHERE longitude IS NULL AND latitude IS NULL;

-- Add indexes for spatial queries (even without PostGIS)
CREATE INDEX IF NOT EXISTS idx_zones_latitude ON zones (latitude);
CREATE INDEX IF NOT EXISTS idx_zones_longitude ON zones (longitude);

-- Add comments
COMMENT ON COLUMN zones.latitude IS 'Latitude in decimal degrees (-90 to 90)';
COMMENT ON COLUMN zones.longitude IS 'Longitude in decimal degrees (-180 to 180)';

-- Note: We keep the location column for backwards compatibility
-- but new code will use latitude/longitude columns directly
