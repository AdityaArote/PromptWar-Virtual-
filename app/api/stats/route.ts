import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse, VenueStats, Zone } from '@/lib/types';

/**
 * GET /api/stats
 * Fetches aggregated statistics for a venue
 * Note: Does NOT filter by is_active to avoid schema dependency issues.
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<VenueStats>>> {
  try {
    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');

    const supabase = await createClient();

    // Query WITHOUT .eq('is_active', true) — column may not exist yet
    let query = supabase
      .from('zones')
      .select('*');

    if (venueId) {
      query = query.eq('venue_id', venueId);
    }

    const { data: zones, error } = await query;

    if (error) {
      console.error('Database error fetching zones for stats:', error);
      return NextResponse.json(
        { data: null, error: 'Failed to fetch statistics' },
        { status: 500 }
      );
    }

    // Calculate statistics
    const stats = calculateStats(zones || []);

    return NextResponse.json({ data: stats, error: null });
  } catch (err) {
    console.error('Unexpected error in GET /api/stats:', err);
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateStats(zones: Zone[]): VenueStats {
  if (zones.length === 0) {
    return {
      totalZones: 0,
      lowWaitZones: 0,
      averageWait: 0,
      improvingZones: 0,
      criticalZones: 0,
    };
  }

  const totalZones = zones.length;
  const lowWaitZones = zones.filter(z => z.status === 'low').length;
  const averageWait = Math.round(
    zones.reduce((sum, z) => sum + z.wait_time_minutes, 0) / totalZones
  );
  const improvingZones = zones.filter(z => z.trending === 'down').length;
  const criticalZones = zones.filter(z => z.status === 'critical').length;

  return {
    totalZones,
    lowWaitZones,
    averageWait,
    improvingZones,
    criticalZones,
  };
}
