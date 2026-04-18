-- Seed data for FlowZone
-- Demo venue: MetLife Stadium

-- Insert demo venue
INSERT INTO public.venues (id, name, capacity, location, image_url)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'MetLife Stadium',
  82500,
  'East Rutherford, NJ',
  '/images/metlife-stadium.jpg'
) ON CONFLICT (id) DO NOTHING;

-- Insert demo event
INSERT INTO public.events (id, venue_id, name, event_time, current_attendance, status)
VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Giants vs Eagles - Week 14',
  'Q2 - 8:42',
  72450,
  'active'
) ON CONFLICT (id) DO NOTHING;

-- Insert demo zones
INSERT INTO public.zones (venue_id, name, category, location, wait_time_minutes, status, crowd_density, trending)
VALUES
  -- Food zones
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Main Concourse Grill', 'food', 'Level 1, Section 112', 8, 'medium', 45, 'stable'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Section 100 Food Court', 'food', 'Level 1, Section 100', 12, 'high', 68, 'up'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Upper Deck Eats', 'food', 'Level 3, Section 301', 3, 'low', 22, 'down'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Field Level Kitchen', 'food', 'Level 1, Section 134', 18, 'critical', 88, 'up'),
  
  -- Drink zones
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Beer Garden North', 'drinks', 'Level 2, Section 210', 6, 'medium', 52, 'stable'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Craft Bar South', 'drinks', 'Level 2, Section 240', 2, 'low', 18, 'down'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Express Drinks', 'drinks', 'Level 1, Section 115', 4, 'low', 28, 'stable'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Premium Lounge Bar', 'drinks', 'Level 2, Club Section', 1, 'low', 15, 'down'),
  
  -- Restroom zones
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Section 110 Restrooms', 'restroom', 'Level 1, Section 110', 5, 'medium', 42, 'stable'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Club Level Facilities', 'restroom', 'Level 2, Club Section', 1, 'low', 12, 'stable'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Upper Deck West', 'restroom', 'Level 3, Section 320', 7, 'medium', 55, 'up'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Field Level East', 'restroom', 'Level 1, Section 140', 14, 'high', 72, 'up'),
  
  -- Merchandise zones
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Team Store Main', 'merchandise', 'Level 1, Main Entrance', 10, 'high', 65, 'stable'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Pop-Up Shop North', 'merchandise', 'Level 2, Section 205', 3, 'low', 25, 'down'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Memorabilia Corner', 'merchandise', 'Level 1, Section 125', 6, 'medium', 48, 'stable'),
  
  -- Exit zones
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Gate A - Main', 'exit', 'Level 1, Main Entrance', 0, 'low', 20, 'stable'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Gate B - North', 'exit', 'Level 1, North Side', 0, 'low', 15, 'stable'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Gate C - South', 'exit', 'Level 1, South Side', 0, 'low', 18, 'stable'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Gate D - VIP', 'exit', 'Level 2, VIP Entrance', 0, 'low', 8, 'stable')
ON CONFLICT DO NOTHING;
