// Database Types - matching Supabase schema
export type ZoneCategory = 'food' | 'drinks' | 'restroom' | 'merchandise' | 'exit';
export type ZoneStatus = 'low' | 'medium' | 'high' | 'critical';
export type TrendDirection = 'up' | 'down' | 'stable';
export type EventStatus = 'upcoming' | 'active' | 'completed';

// Database row types
export interface Venue {
  id: string;
  name: string;
  capacity: number;
  location: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  venue_id: string;
  name: string;
  event_time: string | null;
  current_attendance: number;
  status: EventStatus;
  scheduled_start: string | null;
  created_at: string;
  updated_at: string;
}

export interface Zone {
  id: string;
  venue_id: string;
  name: string;
  category: ZoneCategory;
  location: string;
  wait_time_minutes: number;
  status: ZoneStatus;
  crowd_density: number;
  trending: TrendDirection;
  is_active: boolean;
  last_updated: string;
  created_at: string;
}

export interface ZoneHistory {
  id: string;
  zone_id: string;
  wait_time_minutes: number;
  crowd_density: number;
  status: ZoneStatus;
  recorded_at: string;
}

export interface UserFavorite {
  id: string;
  user_id: string | null;
  session_id: string | null;
  zone_id: string;
  created_at: string;
}

// Combined types for API responses
export interface VenueWithEvent extends Venue {
  events: Event[];
}

export interface VenueInfo {
  id: string;
  name: string;
  event: string;
  currentAttendance: number;
  capacity: number;
  eventTime: string;
}

// Statistics type
export interface VenueStats {
  totalZones: number;
  lowWaitZones: number;
  averageWait: number;
  improvingZones: number;
  criticalZones: number;
}

// Filter types
export interface ZoneFilters {
  category?: ZoneCategory | 'all';
  status?: ZoneStatus | 'all';
  venueId?: string;
}

// Recommendation type
export interface Recommendation {
  type: 'go_now' | 'wait' | 'avoid';
  zone: Zone;
  message: string;
}

// Insert/Update types (without auto-generated fields)
export interface ZoneInsert {
  venue_id: string;
  name: string;
  category: ZoneCategory;
  location: string;
  wait_time_minutes?: number;
  status?: ZoneStatus;
  crowd_density?: number;
  trending?: TrendDirection;
  is_active?: boolean;
}

export interface ZoneUpdate {
  wait_time_minutes?: number;
  status?: ZoneStatus;
  crowd_density?: number;
  trending?: TrendDirection;
  is_active?: boolean;
}

// Real-time payload type
export interface RealtimeZonePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Zone | null;
  old: Zone | null;
}

// API Response wrapper
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

// ========== Push Notifications ==========
export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPreference {
  id: string;
  session_id: string;
  zone_id: string;
  wait_threshold_minutes: number;
  capacity_threshold_pct: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ========== Map / Coordinates ==========
export interface ZoneCoordinates {
  lat: number;
  lng: number;
  floor: number;
  svg_x: number;
  svg_y: number;
}

export interface ZoneWithCoords extends Zone {
  lat: number | null;
  lng: number | null;
  floor: number;
  svg_x: number | null;
  svg_y: number | null;
}

export interface VenueMapConfig {
  map_center_lat: number;
  map_center_lng: number;
  map_zoom: number;
  floorplan_url: string | null;
}

export interface VenueWithMap extends Venue {
  map_center_lat: number;
  map_center_lng: number;
  map_zoom: number;
  floorplan_url: string | null;
}

// ========== Heatmap ==========
export type HeatPoint = [number, number, number]; // [lat, lng, intensity]

export interface HeatmapSnapshot {
  id: string;
  venue_id: string;
  grid_data: HeatPoint[];
  source: 'simulated' | 'iot' | 'wifi';
  captured_at: string;
}

// ========== Smart Routing ==========
export interface RouteRecommendation {
  zone: ZoneWithCoords;
  score: number;
  estimated_walk_minutes: number;
  recommendation_reason: string;
  predicted_wait_minutes?: number;
  trend_indicator: 'improving' | 'worsening' | 'stable';
}

export interface RoutingRequest {
  current_zone_id: string;
  category?: ZoneCategory;
  session_id?: string;
}

// ========== IoT / Data Engineering ==========
export type IoTEventType = 'wifi_probe' | 'ticket_scan' | 'camera';

export interface IoTRawEvent {
  id?: string;
  zone_id: string;
  device_id: string;
  event_type: IoTEventType;
  people_count?: number;
  signal_strength?: number;
  payload?: Record<string, unknown>;
  recorded_at?: string;
}

// ========== ML Predictions ==========
export interface WaitTimePrediction {
  zone_id: string;
  predicted_wait_minutes: number;
  confidence_interval: [number, number];
  model_version: string;
  predicted_at: string;
}
