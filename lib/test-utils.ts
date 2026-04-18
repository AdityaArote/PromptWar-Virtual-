import type { Zone, Venue, Event, VenueStats } from './types';

/**
 * Test utilities and mock data generators
 */

export function createMockZone(overrides: Partial<Zone> = {}): Zone {
  return {
    id: crypto.randomUUID(),
    venue_id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Test Zone',
    category: 'food',
    location: 'Section 100',
    wait_time_minutes: 5,
    status: 'low',
    crowd_density: 30,
    trending: 'stable',
    is_active: true,
    last_updated: new Date().toISOString(),
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockVenue(overrides: Partial<Venue> = {}): Venue {
  return {
    id: crypto.randomUUID(),
    name: 'Test Stadium',
    capacity: 50000,
    location: 'Test City, TS',
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: crypto.randomUUID(),
    venue_id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Test Game',
    event_time: 'Q1 10:00',
    current_attendance: 35000,
    status: 'active',
    scheduled_start: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockStats(overrides: Partial<VenueStats> = {}): VenueStats {
  return {
    totalZones: 14,
    lowWaitZones: 6,
    averageWait: 7,
    improvingZones: 4,
    criticalZones: 2,
    ...overrides,
  };
}

export function createMockZones(count: number = 10): Zone[] {
  const categories: Zone['category'][] = ['food', 'drinks', 'restroom', 'merchandise', 'exit'];
  const statuses: Zone['status'][] = ['low', 'medium', 'high', 'critical'];
  const trends: Zone['trending'][] = ['up', 'down', 'stable'];

  return Array.from({ length: count }, (_, i) => createMockZone({
    id: crypto.randomUUID(),
    name: `Zone ${i + 1}`,
    category: categories[i % categories.length],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    trending: trends[Math.floor(Math.random() * trends.length)],
    wait_time_minutes: Math.floor(Math.random() * 20),
    crowd_density: Math.floor(Math.random() * 100),
  }));
}

/**
 * Assertion helpers for testing
 */
export function assertValidZone(zone: unknown): asserts zone is Zone {
  if (!zone || typeof zone !== 'object') {
    throw new Error('Invalid zone: not an object');
  }
  
  const z = zone as Record<string, unknown>;
  
  if (typeof z.id !== 'string') throw new Error('Invalid zone: missing id');
  if (typeof z.name !== 'string') throw new Error('Invalid zone: missing name');
  if (!['food', 'drinks', 'restroom', 'merchandise', 'exit'].includes(z.category as string)) {
    throw new Error('Invalid zone: invalid category');
  }
  if (!['low', 'medium', 'high', 'critical'].includes(z.status as string)) {
    throw new Error('Invalid zone: invalid status');
  }
}

export function assertValidVenue(venue: unknown): asserts venue is Venue {
  if (!venue || typeof venue !== 'object') {
    throw new Error('Invalid venue: not an object');
  }
  
  const v = venue as Record<string, unknown>;
  
  if (typeof v.id !== 'string') throw new Error('Invalid venue: missing id');
  if (typeof v.name !== 'string') throw new Error('Invalid venue: missing name');
  if (typeof v.capacity !== 'number') throw new Error('Invalid venue: missing capacity');
}

/**
 * API testing helpers
 */
export async function testApiEndpoint(
  url: string, 
  options?: RequestInit
): Promise<{ status: number; data: unknown }> {
  const response = await fetch(url, options);
  const data = await response.json();
  return { status: response.status, data };
}
