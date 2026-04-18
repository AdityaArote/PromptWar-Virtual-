'use client';

import useSWR from 'swr';
import type { VenueWithEvent, Event, ApiResponse } from '@/lib/types';

const fetcher = async (url: string): Promise<VenueWithEvent[]> => {
  const res = await fetch(url);
  const json: ApiResponse<VenueWithEvent[]> = await res.json();
  if (json.error) throw new Error(json.error);
  return json.data || [];
};

export function useVenues() {
  const { data, error, isLoading, mutate } = useSWR<VenueWithEvent[]>(
    '/api/venues',
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );

  return {
    venues: data || [],
    isLoading,
    error: error?.message || null,
    refresh: mutate,
  };
}

export function useActiveVenue() {
  const { venues, isLoading, error } = useVenues();

  // Get first venue with an active event
  const activeVenue = venues.find((v) =>
    v.events?.some((e: Event) => e.status === 'active')
  );

  const activeEvent = activeVenue?.events?.find(
    (e: Event) => e.status === 'active'
  );

  return {
    venue: activeVenue || venues[0] || null,
    event: activeEvent || null,
    isLoading,
    error,
  };
}
