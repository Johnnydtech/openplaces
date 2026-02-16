-- Add foot_traffic_daily column to zones table
-- For storing real foot traffic data from Google Places

ALTER TABLE zones
ADD COLUMN IF NOT EXISTS foot_traffic_daily INTEGER;

COMMENT ON COLUMN zones.foot_traffic_daily IS 'Estimated daily foot traffic from Google Places data';
