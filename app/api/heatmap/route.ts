import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { HeatPoint } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const venueId = request.nextUrl.searchParams.get('venue_id');
    const snapshot = request.nextUrl.searchParams.get('snapshot') || 'latest';

    const supabase = await createClient();

    // Try to get real heatmap data first
    if (venueId) {
      const query = supabase
        .from('heatmap_snapshots')
        .select('*')
        .eq('venue_id', venueId)
        .order('captured_at', { ascending: false });

      if (snapshot === 'latest') {
        query.limit(1);
      }

      const { data: snapshots, error: snapError } = await query;

      if (!snapError && snapshots && snapshots.length > 0) {
        return NextResponse.json({
          data: {
            points: snapshots[0].grid_data as HeatPoint[],
            source: snapshots[0].source,
            captured_at: snapshots[0].captured_at,
          },
          error: null,
        });
      }
    }

    // Fallback: generate heatmap from current zone data
    const { data: zones, error: zoneError } = await supabase
      .from('zones')
      .select('id, name, lat, lng, crowd_density, wait_time_minutes, status')
      .not('lat', 'is', null)
      .not('lng', 'is', null);

    if (zoneError || !zones) {
      return NextResponse.json({ data: null, error: zoneError?.message || 'No zones found' }, { status: 500 });
    }

    // Convert zone data to heat points
    // intensity = crowd_density normalized to 0-1 range
    const heatPoints: HeatPoint[] = [];

    for (const zone of zones) {
      if (zone.lat == null || zone.lng == null) continue;

      const intensity = Math.min(1, (zone.crowd_density || 0) / 100);

      // Add cluster of points around each zone to create a natural heatmap
      const spread = 0.0003; // ~30 meters
      const pointCount = Math.max(3, Math.ceil(intensity * 15));

      for (let i = 0; i < pointCount; i++) {
        const jitterLat = (Math.random() - 0.5) * spread * 2;
        const jitterLng = (Math.random() - 0.5) * spread * 2;
        heatPoints.push([
          zone.lat + jitterLat,
          zone.lng + jitterLng,
          intensity,
        ]);
      }
    }

    return NextResponse.json({
      data: {
        points: heatPoints,
        source: 'zones' as const,
        captured_at: new Date().toISOString(),
      },
      error: null,
    });
  } catch (err) {
    console.error('Heatmap API error:', err);
    return NextResponse.json({ data: null, error: 'Internal server error' }, { status: 500 });
  }
}
