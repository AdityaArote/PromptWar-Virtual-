/**
 * Heatmap Simulator
 * 
 * Generates density grid snapshots and writes to Supabase heatmap_snapshots table.
 * Uses current zone data to create realistic density distributions.
 * 
 * Usage: npx ts-node scripts/simulate-heatmap.ts
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY environment variables');
  process.exit(1);
}

interface HeatPoint {
  lat: number;
  lng: number;
  intensity: number;
}

function generateGrid(
  centerLat: number,
  centerLng: number,
  zones: Array<{ lat: number; lng: number; crowd_density: number }>
): [number, number, number][] {
  const points: [number, number, number][] = [];

  for (const zone of zones) {
    const intensity = Math.min(1, (zone.crowd_density || 0) / 100);
    const spread = 0.0004;
    const count = Math.max(5, Math.ceil(intensity * 20));

    for (let i = 0; i < count; i++) {
      points.push([
        zone.lat + (Math.random() - 0.5) * spread * 2,
        zone.lng + (Math.random() - 0.5) * spread * 2,
        intensity * (0.7 + Math.random() * 0.3),
      ]);
    }
  }

  // Add ambient noise points
  for (let i = 0; i < 20; i++) {
    points.push([
      centerLat + (Math.random() - 0.5) * 0.003,
      centerLng + (Math.random() - 0.5) * 0.003,
      Math.random() * 0.15,
    ]);
  }

  return points;
}

async function run() {
  // Fetch zones
  const zonesRes = await fetch(`${SUPABASE_URL}/rest/v1/zones?is_active=eq.true&select=id,lat,lng,crowd_density,venue_id`, {
    headers: {
      apikey: SUPABASE_KEY!,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });

  if (!zonesRes.ok) {
    console.error('Failed to fetch zones:', await zonesRes.text());
    return;
  }

  const zones = await zonesRes.json();
  const zonesWithCoords = zones.filter((z: Record<string, unknown>) => z.lat != null && z.lng != null);

  if (zonesWithCoords.length === 0) {
    console.log('No zones with coordinates found. Generating mock grid...');
    // Generate a mock grid
    const mockGrid = generateGrid(40.7128, -74.006, [
      { lat: 40.7128, lng: -74.006, crowd_density: 70 },
      { lat: 40.7130, lng: -74.005, crowd_density: 45 },
      { lat: 40.7126, lng: -74.007, crowd_density: 90 },
    ]);

    console.log(`Generated ${mockGrid.length} mock heat points`);
    return;
  }

  // Group by venue
  const venueMap: Record<string, typeof zonesWithCoords> = {};
  for (const z of zonesWithCoords) {
    if (!venueMap[z.venue_id]) venueMap[z.venue_id] = [];
    venueMap[z.venue_id].push(z);
  }

  for (const [venueId, venueZones] of Object.entries(venueMap)) {
    const centerLat = (venueZones as Array<{ lat: number }>).reduce((s: number, z: { lat: number }) => s + z.lat, 0) / venueZones.length;
    const centerLng = (venueZones as Array<{ lng: number }>).reduce((s: number, z: { lng: number }) => s + z.lng, 0) / venueZones.length;

    const grid = generateGrid(centerLat, centerLng, venueZones as Array<{ lat: number; lng: number; crowd_density: number }>);

    // Write to heatmap_snapshots
    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/heatmap_snapshots`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY!,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        venue_id: venueId,
        grid_data: grid,
        source: 'simulated',
      }),
    });

    if (insertRes.ok) {
      console.log(`[Heatmap] Generated ${grid.length} points for venue ${venueId}`);
    } else {
      console.error(`[Heatmap] Failed for venue ${venueId}:`, await insertRes.text());
    }
  }
}

run().catch(console.error);
