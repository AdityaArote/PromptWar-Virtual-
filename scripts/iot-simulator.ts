/**
 * IoT Sensor Simulator
 * 
 * Generates mock Wi-Fi probe, ticket scan, and camera count events
 * and posts them to the /api/ingest endpoint.
 * 
 * Usage: npx ts-node scripts/iot-simulator.ts
 * 
 * Environment: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

const API_URL = process.env.API_URL || 'http://localhost:3000';
const INTERVAL_MS = parseInt(process.env.INTERVAL_MS || '5000', 10);
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '10', 10);

// Mock zone IDs — replace with actual zone IDs from your database
const MOCK_ZONE_IDS = [
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000005',
];

const EVENT_TYPES = ['wifi_probe', 'ticket_scan', 'camera'] as const;
const DEVICE_PREFIXES = ['AP', 'CAM', 'SCAN'] as const;

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateEvent() {
  const typeIdx = randomInt(0, EVENT_TYPES.length - 1);
  const eventType = EVENT_TYPES[typeIdx];
  const zoneId = MOCK_ZONE_IDS[randomInt(0, MOCK_ZONE_IDS.length - 1)];
  const deviceId = `${DEVICE_PREFIXES[typeIdx]}-${randomInt(1, 50).toString().padStart(3, '0')}`;

  return {
    zone_id: zoneId,
    device_id: deviceId,
    event_type: eventType,
    people_count: eventType === 'camera' ? randomInt(1, 150) : undefined,
    signal_strength: eventType === 'wifi_probe' ? randomInt(-90, -20) : undefined,
    payload: {
      timestamp: new Date().toISOString(),
      battery_pct: randomInt(20, 100),
      firmware: '2.1.0',
    },
  };
}

async function sendBatch() {
  const events = Array.from({ length: BATCH_SIZE }, generateEvent);

  try {
    const res = await fetch(`${API_URL}/api/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events }),
    });

    const result = await res.json();

    if (result.error) {
      console.error(`[IoT] Error: ${result.error}`);
    } else {
      console.log(`[IoT] Ingested ${result.data?.ingested || 0} events at ${new Date().toISOString()}`);
    }
  } catch (err) {
    console.error('[IoT] Failed to send batch:', err);
  }
}

// Main loop
console.log(`[IoT Simulator] Starting — batch=${BATCH_SIZE}, interval=${INTERVAL_MS}ms`);
console.log(`[IoT Simulator] Target: ${API_URL}/api/ingest`);

sendBatch(); // immediate first batch
setInterval(sendBatch, INTERVAL_MS);
