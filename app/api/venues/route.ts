import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse, VenueWithEvent } from '@/lib/types';

/**
 * GET /api/venues
 * Fetches all venues. Tries to join events but gracefully falls back
 * if the FK relationship doesn't exist in the schema cache yet.
 */
export async function GET(): Promise<NextResponse<ApiResponse<VenueWithEvent[]>>> {
  try {
    const supabase = await createClient();

    // First try with the events join
    const { data: venues, error } = await supabase
      .from('venues')
      .select('*')
      .order('name');

    if (error) {
      console.error('Database error fetching venues:', error);
      return NextResponse.json(
        { data: null, error: 'Failed to fetch venues' },
        { status: 500 }
      );
    }

    // Now separately fetch any active events to merge in
    // This avoids the FK relationship cache issue (PGRST200)
    const { data: events } = await supabase
      .from('events')
      .select('*')
      .in('venue_id', venues.map(v => v.id));

    // Merge events into venues manually
    const venuesWithEvents = venues.map(venue => ({
      ...venue,
      events: (events || []).filter(e => e.venue_id === venue.id),
    })) as VenueWithEvent[];

    return NextResponse.json({
      data: venuesWithEvents,
      error: null,
      meta: { total: venuesWithEvents.length }
    });
  } catch (err) {
    console.error('Unexpected error in GET /api/venues:', err);
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
