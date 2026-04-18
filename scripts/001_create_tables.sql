-- FlowZone Database Schema
-- Real-time crowd intelligence for sporting venues

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Venues table
CREATE TABLE IF NOT EXISTS public.venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 0,
  location TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  event_time TEXT, -- e.g., "Q2 - 8:42" or "Halftime"
  current_attendance INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('upcoming', 'active', 'completed')),
  scheduled_start TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Zones table - represents areas within a venue
CREATE TABLE IF NOT EXISTS public.zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('food', 'drinks', 'restroom', 'merchandise', 'exit')),
  location TEXT NOT NULL,
  wait_time_minutes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'low' CHECK (status IN ('low', 'medium', 'high', 'critical')),
  crowd_density INTEGER DEFAULT 0 CHECK (crowd_density >= 0 AND crowd_density <= 100),
  trending TEXT DEFAULT 'stable' CHECK (trending IN ('up', 'down', 'stable')),
  is_active BOOLEAN DEFAULT true,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Zone history for analytics (optional, for tracking patterns)
CREATE TABLE IF NOT EXISTS public.zone_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_id UUID NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  wait_time_minutes INTEGER NOT NULL,
  crowd_density INTEGER NOT NULL,
  status TEXT NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- User favorites (anonymous users can save favorites)
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID, -- Can be null for anonymous users (use session ID)
  session_id TEXT, -- For anonymous tracking
  zone_id UUID NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, zone_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_zones_venue_id ON public.zones(venue_id);
CREATE INDEX IF NOT EXISTS idx_zones_category ON public.zones(category);
CREATE INDEX IF NOT EXISTS idx_zones_status ON public.zones(status);
CREATE INDEX IF NOT EXISTS idx_events_venue_id ON public.events(venue_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_zone_history_zone_id ON public.zone_history(zone_id);
CREATE INDEX IF NOT EXISTS idx_zone_history_recorded_at ON public.zone_history(recorded_at);

-- Enable Row Level Security
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Public read access for venues, events, zones
CREATE POLICY "venues_public_read" ON public.venues FOR SELECT USING (true);
CREATE POLICY "events_public_read" ON public.events FOR SELECT USING (true);
CREATE POLICY "zones_public_read" ON public.zones FOR SELECT USING (true);
CREATE POLICY "zone_history_public_read" ON public.zone_history FOR SELECT USING (true);

-- User favorites - users can manage their own favorites
CREATE POLICY "favorites_select_own" ON public.user_favorites 
  FOR SELECT USING (true);
CREATE POLICY "favorites_insert_own" ON public.user_favorites 
  FOR INSERT WITH CHECK (true);
CREATE POLICY "favorites_delete_own" ON public.user_favorites 
  FOR DELETE USING (true);

-- Admin policies (for venue operators) - requires auth
CREATE POLICY "venues_admin_insert" ON public.venues 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "venues_admin_update" ON public.venues 
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "events_admin_all" ON public.events 
  FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "zones_admin_insert" ON public.zones 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "zones_admin_update" ON public.zones 
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "zone_history_admin_insert" ON public.zone_history 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS venues_updated_at ON public.venues;
CREATE TRIGGER venues_updated_at
  BEFORE UPDATE ON public.venues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS events_updated_at ON public.events;
CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Enable realtime for zones table
ALTER PUBLICATION supabase_realtime ADD TABLE public.zones;
