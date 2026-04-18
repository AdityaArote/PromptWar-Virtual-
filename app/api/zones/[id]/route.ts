import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { zoneUpdateSchema, validateBody } from '@/lib/validations';
import type { ApiResponse, Zone } from '@/lib/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/zones/[id]
 * Fetches a single zone by ID
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<Zone>>> {
  try {
    const { id } = await context.params;

    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json(
        { data: null, error: 'Invalid zone ID format' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: zone, error } = await supabase
      .from('zones')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { data: null, error: 'Zone not found' },
          { status: 404 }
        );
      }
      console.error('Database error fetching zone:', error);
      return NextResponse.json(
        { data: null, error: 'Failed to fetch zone' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: zone, error: null });
  } catch (err) {
    console.error('Unexpected error in GET /api/zones/[id]:', err);
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/zones/[id]
 * Updates a zone's real-time data (wait time, status, crowd density, trending)
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<Zone>>> {
  try {
    const { id } = await context.params;

    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json(
        { data: null, error: 'Invalid zone ID format' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { data: updateData, error: validationError } = validateBody(zoneUpdateSchema, body);

    if (validationError) {
      return NextResponse.json(
        { data: null, error: `Validation error: ${validationError}` },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: zone, error } = await supabase
      .from('zones')
      .update({
        ...updateData,
        last_updated: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { data: null, error: 'Zone not found' },
          { status: 404 }
        );
      }
      console.error('Database error updating zone:', error);
      return NextResponse.json(
        { data: null, error: 'Failed to update zone' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: zone, error: null });
  } catch (err) {
    console.error('Unexpected error in PATCH /api/zones/[id]:', err);
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
