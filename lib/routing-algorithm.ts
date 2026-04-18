import type { ZoneWithCoords, RouteRecommendation } from '@/lib/types';

/**
 * Haversine distance between two lat/lng points in meters
 */
function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Estimate walking time in minutes from distance in meters.
 * Assumes average walking speed of 1.2 m/s (crowded venue pace).
 */
function estimateWalkMinutes(distanceMeters: number): number {
  const walkingSpeedMps = 1.2;
  return Math.round((distanceMeters / walkingSpeedMps / 60) * 10) / 10;
}

/**
 * Calculate trend slope from historical wait times.
 * Returns positive if getting worse, negative if improving, 0 if stable.
 */
function calculateTrendSlope(dataPoints: { wait: number; time: string }[]): number {
  if (dataPoints.length < 2) return 0;

  // Simple linear regression on the last few points
  const n = Math.min(dataPoints.length, 6);
  const points = dataPoints.slice(0, n).reverse(); // oldest first

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < points.length; i++) {
    sumX += i;
    sumY += points[i].wait;
    sumXY += i * points[i].wait;
    sumXX += i * i;
  }

  const denominator = points.length * sumXX - sumX * sumX;
  if (denominator === 0) return 0;

  return (points.length * sumXY - sumX * sumY) / denominator;
}

/**
 * Score and rank zone alternatives.
 * Lower score = better recommendation.
 * 
 * Score = wait_time * W_WAIT + walk_minutes * W_WALK + trend_slope * W_TREND
 * 
 * Weights:
 * - Wait time: 0.50 (most important — short wait is the goal)
 * - Walking distance: 0.30 (convenience factor)
 * - Trend: 0.20 (predictive — is this zone getting better or worse?)
 */
export function scoreZones(
  candidates: ZoneWithCoords[],
  currentZone: ZoneWithCoords,
  historyByZone?: Record<string, { wait: number; time: string }[]>,
  weights?: { wait: number; walk: number; trend: number }
): RouteRecommendation[] {
  const W = weights || { wait: 0.50, walk: 0.30, trend: 0.20 };

  const currentLat = currentZone.lat ?? 0;
  const currentLng = currentZone.lng ?? 0;

  const scored: RouteRecommendation[] = candidates.map((zone) => {
    const zoneLat = zone.lat ?? 0;
    const zoneLng = zone.lng ?? 0;

    // Distance
    const distanceMeters = haversineDistance(currentLat, currentLng, zoneLat, zoneLng);
    const walkMinutes = estimateWalkMinutes(distanceMeters);

    // Trend
    const history = historyByZone?.[zone.id] || [];
    const trendSlope = calculateTrendSlope(history);

    // Normalize inputs
    const normalizedWait = zone.wait_time_minutes / 30; // 30 min = worst case
    const normalizedWalk = Math.min(walkMinutes / 10, 1); // 10 min walk = worst case
    const normalizedTrend = Math.max(-1, Math.min(1, trendSlope / 5)); // clamp to [-1, 1]

    const score = normalizedWait * W.wait + normalizedWalk * W.walk + normalizedTrend * W.trend;

    // Determine trend indicator
    let trend_indicator: 'improving' | 'worsening' | 'stable' = 'stable';
    if (trendSlope < -0.5) trend_indicator = 'improving';
    else if (trendSlope > 0.5) trend_indicator = 'worsening';

    // Build recommendation reason
    const reasons: string[] = [];
    if (zone.wait_time_minutes <= 3) reasons.push('Very short wait');
    else if (zone.wait_time_minutes <= 8) reasons.push('Moderate wait');
    if (walkMinutes <= 2) reasons.push('Nearby');
    if (trend_indicator === 'improving') reasons.push('Getting better');
    if (zone.crowd_density < 40) reasons.push('Low crowd');

    return {
      zone,
      score: Math.round(score * 100) / 100,
      estimated_walk_minutes: walkMinutes,
      recommendation_reason: reasons.length > 0 ? reasons.join(' · ') : 'Alternative option',
      predicted_wait_minutes: zone.wait_time_minutes + trendSlope * 5,
      trend_indicator,
    };
  });

  // Sort by score (lower is better)
  return scored.sort((a, b) => a.score - b.score);
}
