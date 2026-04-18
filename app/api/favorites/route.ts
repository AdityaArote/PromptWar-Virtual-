import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { userFavoriteSchema, validateBody } from '@/lib/validations';
import type { ApiResponse, UserFavorite } from '@/lib/types';

/**
 * GET /api/favorites
 * Fetches user's favorite zones
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<UserFavorite[]>>> {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { data: null, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: favorites, error } = await supabase
      .from('user_favorites')
      .select(`
        *,
        zone:zones (*)
      `)
      .eq('session_id', sessionId);

    if (error) {
      console.error('Database error fetching favorites:', error);
      return NextResponse.json(
        { data: null, error: 'Failed to fetch favorites' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: favorites,
      error: null,
      meta: { total: favorites.length }
    });
  } catch (err) {
    console.error('Unexpected error in GET /api/favorites:', err);
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/favorites
 * Adds a zone to user's favorites
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<UserFavorite>>> {
  try {
    const body = await request.json();
    const { data: favoriteData, error: validationError } = validateBody(userFavoriteSchema, body);

    if (validationError) {
      return NextResponse.json(
        { data: null, error: `Validation error: ${validationError}` },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: favorite, error } = await supabase
      .from('user_favorites')
      .insert({
        zone_id: favoriteData!.zone_id,
        session_id: favoriteData!.session_id || crypto.randomUUID(),
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { data: null, error: 'Zone already in favorites' },
          { status: 409 }
        );
      }
      console.error('Database error adding favorite:', error);
      return NextResponse.json(
        { data: null, error: 'Failed to add favorite' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: favorite, error: null }, { status: 201 });
  } catch (err) {
    console.error('Unexpected error in POST /api/favorites:', err);
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/favorites
 * Removes a zone from user's favorites
 */
export async function DELETE(request: NextRequest): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get('zoneId');
    const sessionId = searchParams.get('sessionId');

    if (!zoneId || !sessionId) {
      return NextResponse.json(
        { data: null, error: 'Zone ID and Session ID are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('zone_id', zoneId)
      .eq('session_id', sessionId);

    if (error) {
      console.error('Database error removing favorite:', error);
      return NextResponse.json(
        { data: null, error: 'Failed to remove favorite' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: null, error: null });
  } catch (err) {
    console.error('Unexpected error in DELETE /api/favorites:', err);
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
