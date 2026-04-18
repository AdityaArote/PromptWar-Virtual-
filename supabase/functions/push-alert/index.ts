// Supabase Edge Function: Push Alert
// Triggered by Supabase Database Webhook on zones table UPDATE
// 
// Checks notification_preferences and sends Web Push to matching subscriptions
//
// Deploy: supabase functions deploy push-alert
// Webhook: INSERT/UPDATE on zones → POST to this function

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || '';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req: Request) => {
  try {
    const payload = await req.json();
    const { type, record: zone, old_record: oldZone } = payload;

    if (type !== 'UPDATE' || !zone) {
      return new Response(JSON.stringify({ message: 'Not an update event' }), { status: 200 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get all active notification preferences for this zone
    const { data: prefs, error: prefError } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('zone_id', zone.id)
      .eq('is_active', true);

    if (prefError || !prefs || prefs.length === 0) {
      return new Response(JSON.stringify({ message: 'No matching preferences' }), { status: 200 });
    }

    // Check which preferences should trigger
    const triggers: typeof prefs = [];

    for (const pref of prefs) {
      const waitDropped = zone.wait_time_minutes <= pref.wait_threshold_minutes &&
        (oldZone?.wait_time_minutes || 999) > pref.wait_threshold_minutes;

      const capacityExceeded = zone.crowd_density >= pref.capacity_threshold_pct &&
        (oldZone?.crowd_density || 0) < pref.capacity_threshold_pct;

      if (waitDropped || capacityExceeded) {
        triggers.push(pref);
      }
    }

    if (triggers.length === 0) {
      return new Response(JSON.stringify({ message: 'No thresholds crossed' }), { status: 200 });
    }

    // Get subscriptions for triggered sessions
    const sessionIds = [...new Set(triggers.map((t) => t.session_id))];

    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_session_id', sessionIds);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: 'No subscriptions found' }), { status: 200 });
    }

    // Send push notifications
    let sent = 0;

    for (const sub of subscriptions) {
      const trigger = triggers.find((t) => t.session_id === sub.user_session_id);
      if (!trigger) continue;

      const isWaitAlert = zone.wait_time_minutes <= trigger.wait_threshold_minutes;
      const title = isWaitAlert
        ? `⏱️ ${zone.name} - Wait dropped!`
        : `🚨 ${zone.name} - High capacity!`;
      const body = isWaitAlert
        ? `Wait time is now ${zone.wait_time_minutes} min (below your ${trigger.wait_threshold_minutes} min threshold)`
        : `Capacity reached ${zone.crowd_density}% (above your ${trigger.capacity_threshold_pct}% threshold)`;

      const pushPayload = JSON.stringify({
        title,
        body,
        icon: '/icon-light-32x32.png',
        tag: `zone-${zone.id}`,
        zone_id: zone.id,
        url: `/map?zone=${zone.id}`,
        type: isWaitAlert ? 'wait_drop' : 'capacity_exceed',
      });

      try {
        // Use Web Push protocol
        // Note: In production, use a proper web-push library
        // This is a simplified version for the edge function
        const endpoint = sub.endpoint;

        const pushRes = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'TTL': '86400',
          },
          body: pushPayload,
        });

        if (pushRes.ok || pushRes.status === 201) {
          sent++;
        } else if (pushRes.status === 410) {
          // Subscription expired — remove it
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        }
      } catch (err) {
        console.error(`Failed to push to ${sub.endpoint}:`, err);
      }
    }

    return new Response(
      JSON.stringify({ message: `Sent ${sent} notifications`, triggers: triggers.length }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Push alert function error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 });
  }
});
