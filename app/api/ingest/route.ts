import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { validateBody } from '@/lib/validations';

const iotEventSchema = z.object({
  zone_id: z.string().uuid(),
  device_id: z.string().min(1),
  event_type: z.enum(['wifi_probe', 'ticket_scan', 'camera']).default('wifi_probe'),
  people_count: z.number().int().min(0).optional(),
  signal_strength: z.number().int().optional(),
  payload: z.record(z.unknown()).optional(),
});

const batchSchema = z.object({
  events: z.array(iotEventSchema).min(1).max(500),
  api_key: z.string().optional(), // optional API key for external services
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Support single event or batch
    const isBatch = 'events' in body;
    const events = isBatch ? body.events : [body];

    // Validate
    if (isBatch) {
      const { error: validationError } = validateBody(batchSchema, body);
      if (validationError) {
        return NextResponse.json({ data: null, error: validationError }, { status: 400 });
      }
    } else {
      const { error: validationError } = validateBody(iotEventSchema, body);
      if (validationError) {
        return NextResponse.json({ data: null, error: validationError }, { status: 400 });
      }
    }

    const supabase = await createClient();

    // Bulk insert
    const { data, error: dbError } = await supabase
      .from('iot_raw_events')
      .insert(
        events.map((e: z.infer<typeof iotEventSchema>) => ({
          zone_id: e.zone_id,
          device_id: e.device_id,
          event_type: e.event_type,
          people_count: e.people_count,
          signal_strength: e.signal_strength,
          payload: e.payload,
          recorded_at: new Date().toISOString(),
        }))
      )
      .select('id');

    if (dbError) {
      console.error('IoT ingest error:', dbError);
      return NextResponse.json({ data: null, error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({
      data: { ingested: data?.length || 0 },
      error: null,
    });
  } catch (err) {
    console.error('IoT ingest error:', err);
    return NextResponse.json({ data: null, error: 'Internal server error' }, { status: 500 });
  }
}
