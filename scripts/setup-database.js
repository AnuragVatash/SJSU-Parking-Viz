/**
 * Database setup script for Neon PostgreSQL
 * Run with: node scripts/setup-database.js
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function setupDatabase() {
  console.log('🚀 Setting up SJSU Parking Visualization Database');
  console.log('================================================\n');
  
  console.log('Database URL:', process.env.DATABASE_URL ? 'Found' : 'Not found');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment variables');
    console.error('Please create .env.local file with your database configuration');
    process.exit(1);
  }
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  let client;
  
  try {
    client = await pool.connect();
    console.log('✅ Connected to Neon PostgreSQL database');
    
    // Check if TimescaleDB extension is available
    console.log('\n📋 Checking for TimescaleDB extension...');
    const extensionCheck = await client.query(`
      SELECT * FROM pg_available_extensions 
      WHERE name = 'timescaledb';
    `);
    
    if (extensionCheck.rows.length === 0) {
      console.log('⚠️  TimescaleDB extension not available on this Neon database');
      console.log('   We\'ll proceed with regular PostgreSQL tables');
      console.log('   Performance will be good but not optimized for time-series data');
    } else {
      console.log('✅ TimescaleDB extension is available!');
      
      // Try to create the extension
      try {
        await client.query('CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;');
        console.log('✅ TimescaleDB extension enabled');
      } catch (error) {
        console.log('⚠️  Could not enable TimescaleDB extension:', error.message);
        console.log('   Proceeding with regular PostgreSQL tables');
      }
    }
    
    // Create garage_info table for static garage information
    console.log('\n📊 Creating garage_info table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS garage_info (
        garage_id TEXT PRIMARY KEY,
        garage_name TEXT NOT NULL,
        address TEXT NOT NULL,
        map_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ garage_info table created');

    // Create garage_readings table for time-series data
    console.log('📊 Creating garage_readings table...');
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
    console.log('✅ garage_readings table created');

    // Try to create hypertable if TimescaleDB is available
    try {
      const timescaleCheck = await client.query(`
        SELECT extname FROM pg_extension WHERE extname = 'timescaledb';
      `);
      
      if (timescaleCheck.rows.length > 0) {
        console.log('📊 Creating TimescaleDB hypertable...');
        await client.query(`
          SELECT create_hypertable('garage_readings', 'timestamp', if_not_exists => TRUE);
        `);
        console.log('✅ Hypertable created successfully');
        
        // Create continuous aggregates for different time buckets
        console.log('📊 Creating continuous aggregates...');
        
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
        
        console.log('✅ Continuous aggregates created');
        
        // Add refresh policies
        console.log('📊 Setting up refresh policies...');
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
        
        console.log('✅ Refresh policies configured');
      }
    } catch (error) {
      console.log('⚠️  TimescaleDB features not available, using regular PostgreSQL');
      console.log('   Creating regular indexes for performance...');
      
      // Create regular indexes for performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_garage_readings_garage_timestamp 
        ON garage_readings (garage_id, timestamp DESC);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_garage_readings_timestamp 
        ON garage_readings (timestamp DESC);
      `);
      
      console.log('✅ Performance indexes created');
    }
    
    // Test the setup with a sample query
    console.log('\n🧪 Testing database setup...');
    const testResult = await client.query(`
      SELECT COUNT(*) as reading_count FROM garage_readings;
    `);
    
    console.log(`✅ Database is ready! Current readings: ${testResult.rows[0].reading_count}`);
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Run: pnpm dev');
    console.log('2. Test scraper: curl -X POST http://localhost:3000/api/scrape');
    console.log('3. View dashboard: http://localhost:3000');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

// Run setup if this script is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };
