import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load env vars
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const SUPABASE_URL = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim() || '';
const SUPABASE_KEY = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim() || envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim() || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Only use columns that exist in the base schema (001_create_tables.sql)
const fakeZones = [
  { name: 'Gate A - Main', location: 'Level 1, Main Entrance', category: 'exit', status: 'low', wait_time_minutes: 0, trending: 'stable', crowd_density: 20 },
  { name: 'Gate D - VIP', location: 'Level 2, VIP Entrance', category: 'exit', status: 'low', wait_time_minutes: 0, trending: 'stable', crowd_density: 8 },
  { name: 'Gate C - South', location: 'Level 1, South Side', category: 'exit', status: 'low', wait_time_minutes: 0, trending: 'stable', crowd_density: 18 },
  { name: 'Gate B - North', location: 'Level 1, North Side', category: 'exit', status: 'low', wait_time_minutes: 0, trending: 'stable', crowd_density: 15 },
  { name: 'Club Level Facilities', location: 'Level 2, Club Section', category: 'restroom', status: 'low', wait_time_minutes: 1, trending: 'stable', crowd_density: 12 },
  { name: 'Premium Lounge Bar', location: 'Level 2, Club Section', category: 'drinks', status: 'low', wait_time_minutes: 1, trending: 'down', crowd_density: 15 },
  { name: 'Craft Bar South', location: 'Level 2, Section 240', category: 'drinks', status: 'low', wait_time_minutes: 2, trending: 'down', crowd_density: 18 },
  { name: 'Pop-Up Shop North', location: 'Level 2, Section 205', category: 'merchandise', status: 'low', wait_time_minutes: 3, trending: 'down', crowd_density: 25 },
  { name: 'Upper Deck Eats', location: 'Level 3, Section 301', category: 'food', status: 'low', wait_time_minutes: 3, trending: 'down', crowd_density: 22 },
  { name: 'Express Drinks', location: 'Level 1, Section 115', category: 'drinks', status: 'low', wait_time_minutes: 4, trending: 'stable', crowd_density: 28 },
  { name: 'Section 110 Restrooms', location: 'Level 1, Section 110', category: 'restroom', status: 'medium', wait_time_minutes: 5, trending: 'stable', crowd_density: 42 },
  { name: 'Memorabilia Corner', location: 'Level 1, Section 125', category: 'merchandise', status: 'medium', wait_time_minutes: 6, trending: 'stable', crowd_density: 48 },
  { name: 'Beer Garden North', location: 'Level 2, Section 210', category: 'drinks', status: 'medium', wait_time_minutes: 6, trending: 'stable', crowd_density: 52 },
  { name: 'Upper Deck West', location: 'Level 3, Section 320', category: 'restroom', status: 'medium', wait_time_minutes: 7, trending: 'up', crowd_density: 55 },
  { name: 'Main Concourse Grill', location: 'Level 1, Section 112', category: 'food', status: 'medium', wait_time_minutes: 8, trending: 'stable', crowd_density: 45 },
  { name: 'Team Store Main', location: 'Level 1, Main Entrance', category: 'merchandise', status: 'high', wait_time_minutes: 10, trending: 'stable', crowd_density: 65 },
  { name: 'Section 100 Food Court', location: 'Level 1, Section 100', category: 'food', status: 'high', wait_time_minutes: 12, trending: 'up', crowd_density: 68 },
  { name: 'Field Level East', location: 'Level 1, Section 140', category: 'restroom', status: 'high', wait_time_minutes: 14, trending: 'up', crowd_density: 72 },
  { name: 'Field Level Kitchen', location: 'Level 1, Section 134', category: 'food', status: 'critical', wait_time_minutes: 18, trending: 'up', crowd_density: 88 },
];

async function seed() {
  console.log('Seeding database...');
  // 1. Get or create a venue
  let { data: venues } = await supabase.from('venues').select('*').limit(1);
  let venueId;
  
  if (!venues || venues.length === 0) {
    console.log('No venue found. Creating a default venue...');
    const { data: newVenue, error } = await supabase.from('venues').insert({
      name: 'FlowZone Stadium',
    }).select().single();
    
    if (error) {
       console.error('Error creating venue:', error);
       return;
    }
    venueId = newVenue.id;
  } else {
    venueId = venues[0].id;
  }

  // 2. See if there is an active event — use status field (not is_active boolean)
  let { data: events } = await supabase.from('events').select('*').eq('venue_id', venueId).eq('status', 'active').limit(1);
  if (!events || events.length === 0) {
    console.log('Creating active event for the venue...');
    const { error: eventError } = await supabase.from('events').insert({
      venue_id: venueId,
      name: 'Championship Finals',
      current_attendance: 38500,
      status: 'active',
    });
    if (eventError) console.warn('Event insert warning (non-fatal):', eventError.message);
  }

  // 3. Map zones — only use columns from the base schema
  const zonesToInsert = fakeZones.map(z => ({
    ...z,
    venue_id: venueId,
  }));

  console.log(`Inserting ${zonesToInsert.length} fake zones...`);
  const { error: insertError } = await supabase.from('zones').insert(zonesToInsert);

  if (insertError) {
    console.error('Error inserting zones:', insertError);
  } else {
    console.log('✅ Fake zones successfully inserted!');
  }
}

seed();
