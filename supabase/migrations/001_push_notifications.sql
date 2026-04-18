-- STEP 1: Enable UUID support
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- STEP 2: Create zones table (required before referencing it)
CREATE TABLE IF NOT EXISTS zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- STEP 3: Create push notification subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_session_id TEXT NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- STEP 4: Create notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  wait_threshold_minutes INTEGER NOT NULL DEFAULT 5,
  capacity_threshold_pct NUMERIC(5,2) NOT NULL DEFAULT 80.0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, zone_id)
);

-- STEP 5: Enable Row Level Security
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- STEP 6: Create service-role full-access policies
CREATE POLICY "service role full access"
ON push_subscriptions
USING (true)
WITH CHECK (true);

CREATE POLICY "service role full access"
ON notification_preferences
USING (true)
WITH CHECK (true);

-- STEP 7: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_push_subs_session
ON push_subscriptions(user_session_id);

CREATE INDEX IF NOT EXISTS idx_notif_prefs_session
ON notification_preferences(session_id);

CREATE INDEX IF NOT EXISTS idx_notif_prefs_zone
ON notification_preferences(zone_id);