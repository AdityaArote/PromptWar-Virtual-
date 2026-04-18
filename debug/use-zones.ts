'use client';

import useSWR from 'swr';
import { useEffect, useCallback, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Zone, ZoneCategory, ZoneStatus, ApiResponse } from '@/lib/types';

const fetcher = async (url: string): Promise<Zone[]> => {
  const res = await fetch(url);
  const json: ApiResponse<Zone[]> = await res.json();
  if (json.error) throw new Error(json.error);
  return json.data || [];
};

interface UseZonesOptions {
  category?: ZoneCategory | 'all';
  status?: ZoneStatus | 'all';
  venueId?: string;
  enableRealtime?: boolean;
}

export function useZones(options: UseZonesOptions = {}) {
  const { category, status, venueId, enableRealtime = true } = options;
  const [realtimeZones, setRealtimeZones] = useState<Zone[] | null>(null);

  // Build query string
  const params = new URLSearchParams();
  if (category && category !== 'all') params.set('category', category);
  if (status && status !== 'all') params.set('status', status);
  if (venueId) params.set('venueId', venueId);

  const queryString = params.toString();
  const url = `/api/zones${queryString ? `?${queryString}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<Zone[]>(url, fetcher, {
    refreshInterval: enableRealtime ? 0 : 10000, // Disable polling when realtime is enabled
    revalidateOnFocus: true,
    dedupingInterval: 2000,
  });

  // Keep a ref to the latest SWR data so the realtime callback never closes
  // over a stale snapshot — avoids tearing down the channel on every poll cycle.
  const dataRef = useRef<Zone[] | undefined>(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Set up Supabase realtime subscription
  useEffect(() => {
    if (!enableRealtime) return;

    const supabase = createClient();

    const channel = supabase
      .channel('zones-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'zones',
        },
        (payload) => {
          // Update local state with real-time changes.
          // Use dataRef.current (not data) so we never read a stale closure value.
          setRealtimeZones((current) => {
            const zones = current || dataRef.current || [];

            if (payload.eventType === 'INSERT') {
              const newZone = payload.new as Zone;
              // Check if zone matches current filters
              if (category && category !== 'all' && newZone.category !== category) {
                return zones;
              }
              return [...zones, newZone];
            }

            if (payload.eventType === 'UPDATE') {
              const updatedZone = payload.new as Zone;
              return zones.map((z) => (z.id === updatedZone.id ? updatedZone : z));
            }

            if (payload.eventType === 'DELETE') {
              const deletedZone = payload.old as Zone;
              return zones.filter((z) => z.id !== deletedZone.id);
            }

            return zones;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableRealtime, category]);

  // Sync realtime updates with SWR
  useEffect(() => {
    if (realtimeZones) {
      mutate(realtimeZones, false);
    }
  }, [realtimeZones, mutate]);

  const refresh = useCallback(() => {
    return mutate();
  }, [mutate]);

  return {
    zones: data || [],
    isLoading,
    error: error?.message || null,
    refresh,
  };
}
