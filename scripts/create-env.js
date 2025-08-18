/**
 * Helper script to create .env.local file
 * Run with: node scripts/create-env.js
 */

const fs = require('fs');
const path = require('path');

const envContent = `# Database Configuration (Neon PostgreSQL)
DATABASE_URL=postgresql://neondb_owner:npg_YemgS86PqFLM@ep-red-rice-adwxco8f-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require

# SJSU Parking Data Source
SJSU_PARKING_URL=https://sjsuparkingstatus.sjsu.edu/GarageStatusPlain

# Cron Job Secret (for API authentication)
CRON_SECRET=parking-viz-cron-secret-2025

# Development settings
NODE_ENV=development
`;

const envPath = path.join(process.cwd(), '.env.local');

try {
  if (fs.existsSync(envPath)) {
    console.log('⚠️  .env.local already exists');
    console.log('Current content:');
    console.log(fs.readFileSync(envPath, 'utf8'));
  } else {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env.local created successfully!');
    console.log('\nCreated with content:');
    console.log(envContent);
  }
  
  console.log('\n🔑 Environment variables configured:');
  console.log('- DATABASE_URL: Neon PostgreSQL connection');
  console.log('- SJSU_PARKING_URL: Data source URL');
  console.log('- CRON_SECRET: API authentication key');
  console.log('- NODE_ENV: Development environment');
  
  console.log('\n🚀 Next step: Run "node scripts/setup-database.js"');
  
} catch (error) {
  console.error('❌ Error creating .env.local:', error.message);
}
