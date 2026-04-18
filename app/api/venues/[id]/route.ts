import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse, VenueWithEvent } from '@/lib/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/venues/[id]
 * Fetches a single venue by ID with its events and zones
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<VenueWithEvent & { zones: unknown[] }>>> {
  try {
    const { id } = await context.params;

    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json(
        { data: null, error: 'Invalid venue ID format' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: venue, error } = await supabase
      .from('venues')
      .select(`
        *,
        events (*),
        zones (*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { data: null, error: 'Venue not found' },
          { status: 404 }
        );
      }
      console.error('Database error fetching venue:', error);
      return NextResponse.json(
        { data: null, error: 'Failed to fetch venue' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: venue, error: null });
  } catch (err) {
    console.error('Unexpected error in GET /api/venues/[id]:', err);
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
