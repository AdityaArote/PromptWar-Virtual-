import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { validateBody } from '@/lib/validations';

const subscribeSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
  }),
  session_id: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data: validated, error: validationError } = validateBody(subscribeSchema, body);

    if (validationError || !validated) {
      return NextResponse.json({ data: null, error: validationError }, { status: 400 });
    }

    const supabase = await createClient();
    const { subscription, session_id } = validated;

    // Upsert to avoid duplicate endpoints
    const { error: dbError } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_session_id: session_id || 'anonymous',
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
        { onConflict: 'endpoint' }
      );

    if (dbError) {
      console.error('Push subscribe error:', dbError);
      return NextResponse.json({ data: null, error: 'Failed to save subscription' }, { status: 500 });
    }

    return NextResponse.json({ data: { subscribed: true }, error: null });
  } catch (err) {
    console.error('Push subscribe error:', err);
    return NextResponse.json({ data: null, error: 'Internal server error' }, { status: 500 });
  }
}
