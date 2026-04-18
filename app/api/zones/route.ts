import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { zoneFiltersSchema, validateQuery } from '@/lib/validations';
import type { ApiResponse, Zone } from '@/lib/types';

/**
 * GET /api/zones
 * Fetches all zones with optional filtering by category, status, or venue
 * Note: Does NOT filter by is_active to avoid schema dependency issues.
 * Remove 'inactive' zones by filtering on status instead.
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<Zone[]>>> {
  try {
    const { searchParams } = new URL(request.url);
    const { data: filters, error: validationError } = validateQuery(zoneFiltersSchema, searchParams);

    if (validationError) {
      return NextResponse.json(
        { data: null, error: `Invalid filters: ${validationError}` },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Build query WITHOUT .eq('is_active', true) — column may not exist yet
    let query = supabase
      .from('zones')
      .select('*')
      .order('wait_time_minutes', { ascending: true });

    // Apply filters
    if (filters?.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters?.venueId) {
      query = query.eq('venue_id', filters.venueId);
    }

    const { data: zones, error } = await query;

    if (error) {
      console.error('Database error fetching zones:', error);
      return NextResponse.json(
        { data: null, error: 'Failed to fetch zones' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: zones,
      error: null,
      meta: { total: zones.length }
    });
  } catch (err) {
    console.error('Unexpected error in GET /api/zones:', err);
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
