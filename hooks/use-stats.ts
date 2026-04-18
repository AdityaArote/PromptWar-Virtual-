'use client';

import useSWR from 'swr';
import type { VenueStats, ApiResponse } from '@/lib/types';

const fetcher = async (url: string): Promise<VenueStats> => {
  const res = await fetch(url);
  const json: ApiResponse<VenueStats> = await res.json();
  if (json.error) throw new Error(json.error);
  return (
    json.data || {
      totalZones: 0,
      lowWaitZones: 0,
      averageWait: 0,
      improvingZones: 0,
      criticalZones: 0,
    }
  );
};

interface UseStatsOptions {
  venueId?: string;
  refreshInterval?: number;
}

export function useStats(options: UseStatsOptions = {}) {
  const { venueId, refreshInterval = 10000 } = options;

  const params = new URLSearchParams();
  if (venueId) params.set('venueId', venueId);

  const queryString = params.toString();
  const url = `/api/stats${queryString ? `?${queryString}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<VenueStats>(url, fetcher, {
    refreshInterval,
    revalidateOnFocus: true,
    dedupingInterval: 2000,
  });

  return {
    stats: data || {
      totalZones: 0,
      lowWaitZones: 0,
      averageWait: 0,
      improvingZones: 0,
      criticalZones: 0,
    },
    isLoading,
    error: error?.message || null,
    refresh: mutate,
  };
}
