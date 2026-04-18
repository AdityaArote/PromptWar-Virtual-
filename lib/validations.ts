import { z } from 'zod';

// Zone category enum
export const zoneCategorySchema = z.enum(['food', 'drinks', 'restroom', 'merchandise', 'exit']);

// Zone status enum
export const zoneStatusSchema = z.enum(['low', 'medium', 'high', 'critical']);

// Trend direction enum
export const trendDirectionSchema = z.enum(['up', 'down', 'stable']);

// Event status enum
export const eventStatusSchema = z.enum(['upcoming', 'active', 'completed']);

// Zone filter schema
export const zoneFiltersSchema = z.object({
  category: zoneCategorySchema.or(z.literal('all')).optional(),
  status: zoneStatusSchema.or(z.literal('all')).optional(),
  venueId: z.string().uuid().optional(),
});

// Zone update schema (for PATCH requests)
export const zoneUpdateSchema = z.object({
  wait_time_minutes: z.number().int().min(0).max(120).optional(),
  status: zoneStatusSchema.optional(),
  crowd_density: z.number().int().min(0).max(100).optional(),
  trending: trendDirectionSchema.optional(),
  is_active: z.boolean().optional(),
});

// Zone create schema
export const zoneCreateSchema = z.object({
  venue_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  category: zoneCategorySchema,
  location: z.string().min(1).max(200),
  wait_time_minutes: z.number().int().min(0).max(120).default(0),
  status: zoneStatusSchema.default('low'),
  crowd_density: z.number().int().min(0).max(100).default(0),
  trending: trendDirectionSchema.default('stable'),
  is_active: z.boolean().default(true),
});

// User favorite schema
export const userFavoriteSchema = z.object({
  zone_id: z.string().uuid(),
  session_id: z.string().min(1).optional(),
});

// Venue create schema
export const venueCreateSchema = z.object({
  name: z.string().min(1).max(200),
  capacity: z.number().int().min(0),
  location: z.string().max(500).optional(),
  image_url: z.string().url().optional(),
});

// Event create schema
export const eventCreateSchema = z.object({
  venue_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  event_time: z.string().optional(),
  current_attendance: z.number().int().min(0).default(0),
  status: eventStatusSchema.default('upcoming'),
  scheduled_start: z.string().datetime().optional(),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

// Helper function to validate request body
export function validateBody<T>(schema: z.ZodSchema<T>, data: unknown): { data: T; error: null } | { data: null; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { data: result.data, error: null };
  }
  const errorMessages = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
  return { data: null, error: errorMessages };
}

// Helper function to validate query params
export function validateQuery<T>(schema: z.ZodSchema<T>, params: URLSearchParams): { data: T; error: null } | { data: null; error: string } {
  const obj: Record<string, string> = {};
  params.forEach((value, key) => {
    obj[key] = value;
  });
  return validateBody(schema, obj);
}
