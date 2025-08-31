import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
});

export async function GET(request: NextRequest) {
  try {
    // First check if we can connect to database
    const client = await pool.connect();
    
    try {
      // Check database connectivity
      const dbPing = await client.query('SELECT NOW() as server_time');
      
      // Check if garage_readings table exists
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'garage_readings'
        );
      `);
      
      if (!tableCheck.rows[0].exists) {
        return NextResponse.json({
          status: 'degraded',
          timestamp: new Date().toISOString(),
          database: {
            connected: true,
            server_time: dbPing.rows[0]?.server_time
          },
          data: {
            table_exists: false,
            message: 'Database connected but garage_readings table not found. Run initialization.'
          },
          system: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            node_version: process.version
          }
        }, { 
          status: 200,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
      }
      
      // Check latest data age
      const latestData = await client.query(`
        SELECT 
          MAX(timestamp) as latest_reading,
          COUNT(*) as total_readings,
          COUNT(DISTINCT garage_id) as active_garages,
          EXTRACT(EPOCH FROM (NOW() - MAX(timestamp))) / 60 as minutes_since_last_reading
        FROM garage_readings
        WHERE timestamp >= NOW() - INTERVAL '24 hours'
      `);
      
      const stats = latestData.rows[0];
      const minutesSinceLastReading = parseInt(stats.minutes_since_last_reading || 0);
      
      // Health checks
      const isDatabaseHealthy = !!dbPing.rows[0];
      const isDataFresh = minutesSinceLastReading < 10; // Within 10 minutes
      const hasData = parseInt(stats.total_readings) > 0;
      
      let healthStatus = 'healthy';
      if (!isDatabaseHealthy) {
        healthStatus = 'unhealthy';
      } else if (!hasData || !isDataFresh) {
        healthStatus = 'degraded';
      }
      
      const response = {
        status: healthStatus,
        timestamp: new Date().toISOString(),
        database: {
          connected: isDatabaseHealthy,
          server_time: dbPing.rows[0]?.server_time
        },
        data: {
          latest_reading: stats.latest_reading,
          minutes_since_last_reading: minutesSinceLastReading,
          total_readings_24h: parseInt(stats.total_readings || 0),
          active_garages: parseInt(stats.active_garages || 0),
          is_fresh: isDataFresh,
          has_data: hasData
        },
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          node_version: process.version
        }
      };
      
      return NextResponse.json(response, { 
        status: healthStatus === 'healthy' ? 200 : (healthStatus === 'degraded' ? 200 : 503),
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      database: {
        connected: false
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        node_version: process.version
      }
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}
