import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { validateBody } from '@/lib/validations';

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { data: validated, error: validationError } = validateBody(unsubscribeSchema, body);

    if (validationError || !validated) {
      return NextResponse.json({ data: null, error: validationError }, { status: 400 });
    }

    const supabase = await createClient();

    const { error: dbError } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', validated.endpoint);

    if (dbError) {
      console.error('Push unsubscribe error:', dbError);
      return NextResponse.json({ data: null, error: 'Failed to remove subscription' }, { status: 500 });
    }

    return NextResponse.json({ data: { unsubscribed: true }, error: null });
  } catch (err) {
    console.error('Push unsubscribe error:', err);
    return NextResponse.json({ data: null, error: 'Internal server error' }, { status: 500 });
  }
}
