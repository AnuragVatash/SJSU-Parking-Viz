import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
});

export interface GarageReading {
  id?: number;
  garage_id: string;
  garage_name: string;
  address: string;
  occupied_percentage: number;
  capacity?: number;
  occupied_spaces?: number;
  timestamp: Date;
  source_hash?: string;
}

export interface GarageInfo {
  garage_id: string;
  garage_name: string;
  address: string;
  map_url?: string;
}

// Initialize TimescaleDB hypertable
export async function initializeDatabase() {
  const client = await pool.connect();
  try {
    // Create extension if not exists
    await client.query('CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;');
    
    // Create garage_info table for static garage information
    await client.query(`
      CREATE TABLE IF NOT EXISTS garage_info (
        garage_id TEXT PRIMARY KEY,
        garage_name TEXT NOT NULL,
        address TEXT NOT NULL,
        map_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Create garage_readings table for time-series data
    await client.query(`
      CREATE TABLE IF NOT EXISTS garage_readings (
        id SERIAL,
        garage_id TEXT NOT NULL,
        garage_name TEXT NOT NULL,
        address TEXT NOT NULL,
        occupied_percentage FLOAT NOT NULL,
        capacity INTEGER,
        occupied_spaces INTEGER,
        timestamp TIMESTAMPTZ NOT NULL,
        source_hash TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT garage_readings_unique_reading UNIQUE (garage_id, timestamp)
      );
    `);

    // Create hypertable (only if not already a hypertable)
    try {
      await client.query(`
        SELECT create_hypertable('garage_readings', 'timestamp', if_not_exists => TRUE);
      `);
    } catch (error) {
      // Hypertable might already exist, which is fine
      console.log('Hypertable might already exist:', error);
    }

    // Create continuous aggregates for different time buckets
    await client.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS garage_readings_5min
      WITH (timescaledb.continuous) AS
      SELECT 
        garage_id,
        garage_name,
        time_bucket('5 minutes', timestamp) AS bucket,
        avg(occupied_percentage) AS avg_utilization,
        max(occupied_percentage) AS max_utilization,
        min(occupied_percentage) AS min_utilization,
        last(occupied_percentage, timestamp) AS last_utilization
      FROM garage_readings
      GROUP BY garage_id, garage_name, bucket;
    `);

    await client.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS garage_readings_hourly
      WITH (timescaledb.continuous) AS
      SELECT 
        garage_id,
        garage_name,
        time_bucket('1 hour', timestamp) AS bucket,
        avg(occupied_percentage) AS avg_utilization,
        max(occupied_percentage) AS max_utilization,
        min(occupied_percentage) AS min_utilization,
        last(occupied_percentage, timestamp) AS last_utilization
      FROM garage_readings
      GROUP BY garage_id, garage_name, bucket;
    `);

    // Add refresh policies for continuous aggregates
    await client.query(`
      SELECT add_continuous_aggregate_policy('garage_readings_5min',
        start_offset => INTERVAL '1 hour',
        end_offset => INTERVAL '5 minutes',
        schedule_interval => INTERVAL '5 minutes',
        if_not_exists => TRUE);
    `);

    await client.query(`
      SELECT add_continuous_aggregate_policy('garage_readings_hourly',
        start_offset => INTERVAL '6 hours',
        end_offset => INTERVAL '1 hour',
        schedule_interval => INTERVAL '1 hour',
        if_not_exists => TRUE);
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Insert a garage reading (idempotent)
export async function insertGarageReading(reading: GarageReading) {
  const client = await pool.connect();
  try {
    // Round timestamp to the minute for consistency
    const roundedTimestamp = new Date(reading.timestamp);
    roundedTimestamp.setSeconds(0, 0);

    const query = `
      INSERT INTO garage_readings 
      (garage_id, garage_name, address, occupied_percentage, capacity, occupied_spaces, timestamp, source_hash)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (garage_id, timestamp) 
      DO UPDATE SET 
        garage_name = EXCLUDED.garage_name,
        address = EXCLUDED.address,
        occupied_percentage = EXCLUDED.occupied_percentage,
        capacity = EXCLUDED.capacity,
        occupied_spaces = EXCLUDED.occupied_spaces,
        source_hash = EXCLUDED.source_hash,
        created_at = NOW()
      RETURNING id;
    `;

    const values = [
      reading.garage_id,
      reading.garage_name,
      reading.address,
      reading.occupied_percentage,
      reading.capacity,
      reading.occupied_spaces,
      roundedTimestamp,
      reading.source_hash
    ];

    const result = await client.query(query, values);
    return result.rows[0];
  } finally {
    client.release();
  }
}

// Get latest readings for all garages
export async function getLatestReadings(): Promise<GarageReading[]> {
  const client = await pool.connect();
  try {
    const query = `
      SELECT DISTINCT ON (garage_id) 
        garage_id, garage_name, address, occupied_percentage, 
        capacity, occupied_spaces, timestamp, source_hash
      FROM garage_readings
      ORDER BY garage_id, timestamp DESC;
    `;
    
    const result = await client.query(query);
    return result.rows;
  } finally {
    client.release();
  }
}

// Get historical data for forecasting (last N days)
export async function getHistoricalData(garageId: string, days: number = 14): Promise<GarageReading[]> {
  const client = await pool.connect();
  try {
    const query = `
      SELECT garage_id, garage_name, address, occupied_percentage, 
             capacity, occupied_spaces, timestamp
      FROM garage_readings
      WHERE garage_id = $1 
        AND timestamp >= NOW() - INTERVAL '${days} days'
      ORDER BY timestamp;
    `;
    
    const result = await client.query(query, [garageId]);
    return result.rows;
  } finally {
    client.release();
  }
}

// Get aggregated data for charts
export async function getAggregatedData(
  garageId: string, 
  interval: '5min' | 'hourly' = '5min',
  hours: number = 24
): Promise<any[]> {
  const client = await pool.connect();
  try {
    const tableName = interval === '5min' ? 'garage_readings_5min' : 'garage_readings_hourly';
    const query = `
      SELECT bucket as timestamp, avg_utilization, max_utilization, min_utilization, last_utilization
      FROM ${tableName}
      WHERE garage_id = $1 
        AND bucket >= NOW() - INTERVAL '${hours} hours'
      ORDER BY bucket;
    `;
    
    const result = await client.query(query, [garageId]);
    return result.rows;
  } finally {
    client.release();
  }
}

export { pool };
