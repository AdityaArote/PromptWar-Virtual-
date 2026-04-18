-- STEP 1: Enable UUID generator
CREATE EXTENSION IF NOT EXISTS pgcrypto;

--------------------------------------------------
-- STEP 2: Create dependency tables first
--------------------------------------------------

-- Venues table (required before heatmap_snapshots)
CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Zones table (required before iot_raw_events)
CREATE TABLE IF NOT EXISTS zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  name TEXT,
  capacity INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- zone_history table (required before ALTER TABLE)
CREATE TABLE IF NOT EXISTS zone_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
  occupancy INTEGER,
  wait_minutes INTEGER,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

--------------------------------------------------
-- STEP 3: Create heatmap_snapshots table
--------------------------------------------------

CREATE TABLE IF NOT EXISTS heatmap_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  grid_data JSONB NOT NULL,
  source TEXT DEFAULT 'simulated',
  captured_at TIMESTAMPTZ DEFAULT now()
);

--------------------------------------------------
-- STEP 4: Create IoT raw events table
--------------------------------------------------

CREATE TABLE IF NOT EXISTS iot_raw_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
  device_id TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'wifi_probe',
  people_count INTEGER,
  signal_strength INTEGER,
  payload JSONB,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

--------------------------------------------------
-- STEP 5: Extend zone_history safely
--------------------------------------------------

ALTER TABLE zone_history
ADD COLUMN IF NOT EXISTS hour_of_day INTEGER;

ALTER TABLE zone_history
ADD COLUMN IF NOT EXISTS day_of_week INTEGER;

ALTER TABLE zone_history
ADD COLUMN IF NOT EXISTS predicted_wait_minutes NUMERIC(6,2);

--------------------------------------------------
-- STEP 6: Indexes for performance
--------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_heatmap_venue_time
ON heatmap_snapshots(venue_id, captured_at DESC);

CREATE INDEX IF NOT EXISTS idx_iot_zone_time
ON iot_raw_events(zone_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_zone_history_time
ON zone_history(zone_id, recorded_at DESC);

--------------------------------------------------
-- STEP 7: Enable Row Level Security
--------------------------------------------------

ALTER TABLE heatmap_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE iot_raw_events ENABLE ROW LEVEL SECURITY;

--------------------------------------------------
-- STEP 8: Policies
--------------------------------------------------

CREATE POLICY "public read heatmaps"
ON heatmap_snapshots
FOR SELECT
USING (true);

CREATE POLICY "service write heatmaps"
ON heatmap_snapshots
FOR INSERT
WITH CHECK (true);

CREATE POLICY "service write iot"
ON iot_raw_events
FOR INSERT
WITH CHECK (true);

CREATE POLICY "service read iot"
ON iot_raw_events
FOR SELECT
USING (true);