'use client';

import { useState, useCallback } from 'react';
import type { RouteRecommendation } from '@/lib/types';

interface UseRoutingReturn {
  recommendations: RouteRecommendation[];
  isLoading: boolean;
  error: string | null;
  getRecommendations: (currentZoneId: string, category?: string) => Promise<void>;
  clearRecommendations: () => void;
}

export function useRouting(): UseRoutingReturn {
  const [recommendations, setRecommendations] = useState<RouteRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRecommendations = useCallback(async (currentZoneId: string, category?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/routing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_zone_id: currentZoneId,
          category,
        }),
      });

      const result = await res.json();

      if (result.error) {
        setError(result.error);
        setRecommendations([]);
      } else {
        setRecommendations(result.data?.recommendations || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get recommendations');
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearRecommendations = useCallback(() => {
    setRecommendations([]);
    setError(null);
  }, []);

  return { recommendations, isLoading, error, getRecommendations, clearRecommendations };
}
