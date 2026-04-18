// Supabase Edge Function: Data Aggregator
// Scheduled via pg_cron every 5 minutes
//
// Reads raw IoT events, aggregates per zone, updates zones table,
// and appends to zone_history for ML training.
//
// Deploy: supabase functions deploy data-aggregator

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (_req: Request) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get unprocessed events from last 5 minutes
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { data: events, error: eventsError } = await supabase
      .from('iot_raw_events')
      .select('*')
      .gte('recorded_at', fiveMinAgo);

    if (eventsError || !events || events.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No recent events to process', count: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Group events by zone
    const byZone: Record<string, typeof events> = {};
    for (const event of events) {
      if (!event.zone_id) continue;
      if (!byZone[event.zone_id]) byZone[event.zone_id] = [];
      byZone[event.zone_id].push(event);
    }

    let updated = 0;

    for (const [zoneId, zoneEvents] of Object.entries(byZone)) {
      // Aggregate people counts
      const cameraCounts = zoneEvents
        .filter((e) => e.event_type === 'camera' && e.people_count != null)
        .map((e) => e.people_count!);

      const wifiProbes = zoneEvents
        .filter((e) => e.event_type === 'wifi_probe')
        .length;

      const ticketScans = zoneEvents
        .filter((e) => e.event_type === 'ticket_scan')
        .length;

      // Estimate crowd density (0-100)
      let density = 0;
      if (cameraCounts.length > 0) {
        const avgCount = cameraCounts.reduce((a, b) => a + b, 0) / cameraCounts.length;
        density = Math.min(100, Math.round(avgCount / 1.5)); // normalize
      } else {
        // Fallback to Wi-Fi count estimate
        density = Math.min(100, wifiProbes * 3 + ticketScans * 5);
      }

      // Estimate wait time from density
      const waitMinutes = Math.round(density * 0.3); // rough: 100% density ≈ 30 min wait

      // Determine status
      let status = 'low';
      if (density > 80) status = 'critical';
      else if (density > 60) status = 'high';
      else if (density > 35) status = 'medium';

      // Determine trend direction
      // Compare to previous update
      const { data: prevHistory } = await supabase
        .from('zone_history')
        .select('wait_time_minutes')
        .eq('zone_id', zoneId)
        .order('recorded_at', { ascending: false })
        .limit(1);

      let trending = 'stable';
      if (prevHistory && prevHistory.length > 0) {
        const diff = waitMinutes - prevHistory[0].wait_time_minutes;
        if (diff > 2) trending = 'up';
        else if (diff < -2) trending = 'down';
      }

      // Update zones table
      await supabase
        .from('zones')
        .update({
          wait_time_minutes: waitMinutes,
          crowd_density: density,
          status,
          trending,
          last_updated: new Date().toISOString(),
        })
        .eq('id', zoneId);

      // Append to zone_history
      const now = new Date();
      await supabase.from('zone_history').insert({
        zone_id: zoneId,
        wait_time_minutes: waitMinutes,
        crowd_density: density,
        status,
        hour_of_day: now.getHours(),
        day_of_week: now.getDay(),
        recorded_at: now.toISOString(),
      });

      updated++;
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${events.length} events, updated ${updated} zones`,
        events_count: events.length,
        zones_updated: updated,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Data aggregator error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 });
  }
});
