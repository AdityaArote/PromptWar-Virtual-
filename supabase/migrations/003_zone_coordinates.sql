-- Add map coordinates to zones
ALTER TABLE zones
  ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS floor INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS svg_x DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS svg_y DOUBLE PRECISION;

-- Add venue map config
ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS map_center_lat DOUBLE PRECISION DEFAULT 40.7128,
  ADD COLUMN IF NOT EXISTS map_center_lng DOUBLE PRECISION DEFAULT -74.0060,
  ADD COLUMN IF NOT EXISTS map_zoom INTEGER DEFAULT 17,
  ADD COLUMN IF NOT EXISTS floorplan_url TEXT;

-- Seed mock coordinates for existing zones (relative to a demo venue location)
-- These will be overridden by real data; just examples
UPDATE zones SET
  lat = 40.7128 + (RANDOM() - 0.5) * 0.002,
  lng = -74.0060 + (RANDOM() - 0.5) * 0.002,
  floor = 1,
  svg_x = RANDOM() * 800,
  svg_y = RANDOM() * 600
WHERE lat IS NULL;
