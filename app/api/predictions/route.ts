import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get all zones
    const { data: zones, error: zoneError } = await supabase
      .from('zones')
      .select('id, name, lat, lng, wait_time_minutes, crowd_density, status, trending')
      .eq('is_active', true);

    if (zoneError || !zones) {
      return NextResponse.json({ data: null, error: zoneError?.message || 'No zones found' }, { status: 500 });
    }

    // Fetch latest predictions if ML service available
    const predictions: Record<string, { predicted: number; confidence: [number, number] }> = {};

    // Try ML predictions endpoint (fails gracefully)
    try {
      const mlUrl = process.env.ML_PREDICTION_URL;
      if (mlUrl) {
        const mlRes = await fetch(`${mlUrl}/predict/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            zones: zones.map((z) => ({
              zone_id: z.id,
              hour: new Date().getHours(),
              day_of_week: new Date().getDay(),
            })),
          }),
          signal: AbortSignal.timeout(3000),
        });

        if (mlRes.ok) {
          const mlData = await mlRes.json();
          for (const pred of mlData.predictions || []) {
            predictions[pred.zone_id] = {
              predicted: pred.predicted_wait_minutes,
              confidence: pred.confidence_interval,
            };
          }
        }
      }
    } catch {
      // ML service unavailable — proceed with fallback
    }

    // Fallback: simple moving average from zone_history
    if (Object.keys(predictions).length === 0) {
      const { data: history } = await supabase
        .from('zone_history')
        .select('zone_id, wait_time_minutes')
        .order('recorded_at', { ascending: false })
        .limit(zones.length * 5);

      if (history) {
        const grouped: Record<string, number[]> = {};
        for (const h of history) {
          if (!grouped[h.zone_id]) grouped[h.zone_id] = [];
          grouped[h.zone_id].push(h.wait_time_minutes);
        }

        for (const [zoneId, waits] of Object.entries(grouped)) {
          const avg = waits.reduce((a, b) => a + b, 0) / waits.length;
          const stdDev = Math.sqrt(waits.reduce((s, w) => s + (w - avg) ** 2, 0) / waits.length);
          predictions[zoneId] = {
            predicted: Math.round(avg * 10) / 10,
            confidence: [
              Math.max(0, Math.round((avg - stdDev) * 10) / 10),
              Math.round((avg + stdDev) * 10) / 10,
            ],
          };
        }
      }
    }

    // Build response
    const result = zones.map((z) => ({
      zone_id: z.id,
      zone_name: z.name,
      current_wait: z.wait_time_minutes,
      predicted_wait_minutes: predictions[z.id]?.predicted ?? z.wait_time_minutes,
      confidence_interval: predictions[z.id]?.confidence ?? [z.wait_time_minutes, z.wait_time_minutes],
      model_version: Object.keys(predictions).length > 0 ? 'moving_avg_v1' : 'current',
      predicted_at: new Date().toISOString(),
    }));

    return NextResponse.json({ data: result, error: null });
  } catch (err) {
    console.error('Predictions API error:', err);
    return NextResponse.json({ data: null, error: 'Internal server error' }, { status: 500 });
  }
}
