import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: {
      status: 'connected' | 'disconnected';
      latencyMs?: number;
    };
    api: {
      status: 'running';
      version: string;
    };
  };
}

/**
 * GET /api/health
 * Health check endpoint for monitoring and deployment verification
 */
export async function GET(): Promise<NextResponse<HealthStatus>> {
  const startTime = Date.now();
  let dbStatus: 'connected' | 'disconnected' = 'disconnected';
  let dbLatency: number | undefined;

  try {
    const supabase = await createClient();
    
    // Test database connection with a simple query
    const dbStart = Date.now();
    const { error } = await supabase.from('venues').select('id').limit(1);
    dbLatency = Date.now() - dbStart;
    
    if (!error) {
      dbStatus = 'connected';
    }
  } catch {
    dbStatus = 'disconnected';
  }

  const overallStatus = dbStatus === 'connected' ? 'healthy' : 'degraded';

  return NextResponse.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    services: {
      database: {
        status: dbStatus,
        latencyMs: dbLatency,
      },
      api: {
        status: 'running',
        version: '1.0.0',
      },
    },
  });
}
