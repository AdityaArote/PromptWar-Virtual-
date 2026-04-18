/**
 * API Integration Tests
 * 
 * These tests verify the API endpoints work correctly.
 * Run with: npx vitest run
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createMockZone, createMockVenue, assertValidZone, assertValidVenue } from '@/lib/test-utils';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

describe('FlowZone API', () => {
  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await fetch(`${BASE_URL}/api/health`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('services');
      expect(['healthy', 'degraded', 'unhealthy']).toContain(data.status);
    });
  });

  describe('GET /api/zones', () => {
    it('should return list of zones', async () => {
      const response = await fetch(`${BASE_URL}/api/zones`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.data)).toBe(true);
      
      if (data.data.length > 0) {
        assertValidZone(data.data[0]);
      }
    });

    it('should filter zones by category', async () => {
      const response = await fetch(`${BASE_URL}/api/zones?category=food`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.every((z: { category: string }) => z.category === 'food')).toBe(true);
    });

    it('should filter zones by status', async () => {
      const response = await fetch(`${BASE_URL}/api/zones?status=low`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.every((z: { status: string }) => z.status === 'low')).toBe(true);
    });

    it('should reject invalid category filter', async () => {
      const response = await fetch(`${BASE_URL}/api/zones?category=invalid`);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
    });
  });

  describe('GET /api/venues', () => {
    it('should return list of venues', async () => {
      const response = await fetch(`${BASE_URL}/api/venues`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.data)).toBe(true);
      
      if (data.data.length > 0) {
        assertValidVenue(data.data[0]);
      }
    });
  });

  describe('GET /api/stats', () => {
    it('should return venue statistics', async () => {
      const response = await fetch(`${BASE_URL}/api/stats`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveProperty('totalZones');
      expect(data.data).toHaveProperty('lowWaitZones');
      expect(data.data).toHaveProperty('averageWait');
      expect(data.data).toHaveProperty('improvingZones');
      expect(data.data).toHaveProperty('criticalZones');
      
      expect(typeof data.data.totalZones).toBe('number');
      expect(typeof data.data.averageWait).toBe('number');
    });
  });

  describe('GET /api/favorites', () => {
    it('should require sessionId parameter', async () => {
      const response = await fetch(`${BASE_URL}/api/favorites`);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Session ID');
    });

    it('should return empty favorites for new session', async () => {
      const sessionId = crypto.randomUUID();
      const response = await fetch(`${BASE_URL}/api/favorites?sessionId=${sessionId}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual([]);
    });
  });
});

describe('Mock Data Utilities', () => {
  it('should create valid mock zone', () => {
    const zone = createMockZone();
    assertValidZone(zone);
  });

  it('should create mock zone with overrides', () => {
    const zone = createMockZone({ name: 'Custom Zone', wait_time_minutes: 15 });
    expect(zone.name).toBe('Custom Zone');
    expect(zone.wait_time_minutes).toBe(15);
  });

  it('should create valid mock venue', () => {
    const venue = createMockVenue();
    assertValidVenue(venue);
  });
});
