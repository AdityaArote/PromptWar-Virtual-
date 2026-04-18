import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { validateBody } from '@/lib/validations';

const preferenceSchema = z.object({
  session_id: z.string().min(1),
  zone_id: z.string().uuid(),
  wait_threshold_minutes: z.number().int().min(1).max(60).default(5),
  capacity_threshold_pct: z.number().min(50).max(100).default(80),
  is_active: z.boolean().default(true),
});

// GET all preferences for a session
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ data: null, error: 'session_id is required' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error: dbError } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('session_id', sessionId)
      .eq('is_active', true);

    if (dbError) {
      return NextResponse.json({ data: null, error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ data, error: null });
  } catch (err) {
    console.error('Get preferences error:', err);
    return NextResponse.json({ data: null, error: 'Internal server error' }, { status: 500 });
  }
}

// POST/upsert preference
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data: validated, error: validationError } = validateBody(preferenceSchema, body);

    if (validationError || !validated) {
      return NextResponse.json({ data: null, error: validationError }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error: dbError } = await supabase
      .from('notification_preferences')
      .upsert(
        {
          session_id: validated.session_id,
          zone_id: validated.zone_id,
          wait_threshold_minutes: validated.wait_threshold_minutes,
          capacity_threshold_pct: validated.capacity_threshold_pct,
          is_active: validated.is_active,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'session_id,zone_id' }
      )
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ data: null, error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ data, error: null });
  } catch (err) {
    console.error('Set preferences error:', err);
    return NextResponse.json({ data: null, error: 'Internal server error' }, { status: 500 });
  }
}
