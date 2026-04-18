'use client';

import useSWR from 'swr';
import type { HeatPoint } from '@/lib/types';

interface HeatmapData {
  points: HeatPoint[];
  source: string;
  captured_at: string;
}

const fetcher = async (url: string): Promise<HeatmapData> => {
  const res = await fetch(url);
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.data;
};

interface UseHeatmapOptions {
  venueId?: string;
  refreshInterval?: number;
  enabled?: boolean;
}

export function useHeatmap(options: UseHeatmapOptions = {}) {
  const { venueId, refreshInterval = 30000, enabled = true } = options;

  const params = new URLSearchParams();
  if (venueId) params.set('venue_id', venueId);
  params.set('snapshot', 'latest');

  const url = `/api/heatmap?${params.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<HeatmapData>(
    enabled ? url : null,
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  );

  return {
    heatPoints: data?.points || [],
    source: data?.source || 'none',
    capturedAt: data?.captured_at || null,
    isLoading,
    error: error?.message || null,
    refresh: () => mutate(),
  };
}
