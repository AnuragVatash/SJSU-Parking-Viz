/**
 * Fix corrupted .env.local file
 */

const fs = require('fs');
const path = require('path');

const cleanEnvContent = `DATABASE_URL=postgresql://neondb_owner:npg_YemgS86PqFLM@ep-red-rice-adwxco8f-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
SJSU_PARKING_URL=https://sjsuparkingstatus.sjsu.edu/GarageStatusPlain
CRON_SECRET=parking-viz-cron-secret-2025
NODE_ENV=development`;

const envPath = path.join(process.cwd(), '.env.local');

try {
  fs.writeFileSync(envPath, cleanEnvContent);
  console.log('✅ .env.local cleaned and fixed!');
  console.log('\nNew content:');
  console.log(cleanEnvContent);
} catch (error) {
  console.error('❌ Error fixing .env.local:', error.message);
}
