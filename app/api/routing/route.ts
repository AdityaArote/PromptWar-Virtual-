import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { validateBody } from '@/lib/validations';
import { scoreZones } from '@/lib/routing-algorithm';
import type { ZoneWithCoords } from '@/lib/types';

const routingSchema = z.object({
  current_zone_id: z.string().uuid(),
  category: z.enum(['food', 'drinks', 'restroom', 'merchandise', 'exit']).optional(),
  session_id: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data: validated, error: validationError } = validateBody(routingSchema, body);

    if (validationError || !validated) {
      return NextResponse.json({ data: null, error: validationError }, { status: 400 });
    }

    const supabase = await createClient();

    // Get current zone
    const { data: currentZone, error: currentError } = await supabase
      .from('zones')
      .select('*')
      .eq('id', validated.current_zone_id)
      .single();

    if (currentError || !currentZone) {
      return NextResponse.json({ data: null, error: 'Zone not found' }, { status: 404 });
    }

    // Get all candidate zones (same category or all if not specified)
    let query = supabase
      .from('zones')
      .select('*')
      .eq('is_active', true)
      .neq('id', validated.current_zone_id);

    if (validated.category) {
      query = query.eq('category', validated.category);
    } else {
      query = query.eq('category', currentZone.category);
    }

    const { data: candidates, error: candidatesError } = await query;

    if (candidatesError) {
      return NextResponse.json({ data: null, error: candidatesError.message }, { status: 500 });
    }

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({
        data: { recommendations: [], message: 'No alternative zones available' },
        error: null,
      });
    }

    // Get zone history for trend predictions (last 6 data points per zone)
    const zoneIds = candidates.map((z) => z.id);
    const { data: history } = await supabase
      .from('zone_history')
      .select('zone_id, wait_time_minutes, recorded_at')
      .in('zone_id', zoneIds)
      .order('recorded_at', { ascending: false })
      .limit(zoneIds.length * 6);

    // Group history by zone
    const historyByZone: Record<string, { wait: number; time: string }[]> = {};
    if (history) {
      for (const h of history) {
        if (!historyByZone[h.zone_id]) historyByZone[h.zone_id] = [];
        historyByZone[h.zone_id].push({
          wait: h.wait_time_minutes,
          time: h.recorded_at,
        });
      }
    }

    // Score all candidates
    const recommendations = scoreZones(
      candidates as ZoneWithCoords[],
      currentZone as ZoneWithCoords,
      historyByZone
    );

    return NextResponse.json({
      data: { recommendations: recommendations.slice(0, 5) },
      error: null,
    });
  } catch (err) {
    console.error('Routing API error:', err);
    return NextResponse.json({ data: null, error: 'Internal server error' }, { status: 500 });
  }
}
