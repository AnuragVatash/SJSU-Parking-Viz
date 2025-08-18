/**
 * Setup script to add QStash environment variables
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up QStash for SJSU Parking Viz');
console.log('==========================================\n');

const envPath = path.join(process.cwd(), '.env.local');

// Read current .env.local
let currentEnv = '';
if (fs.existsSync(envPath)) {
  currentEnv = fs.readFileSync(envPath, 'utf8');
  console.log('✅ Found existing .env.local file');
} else {
  console.log('❌ .env.local file not found');
  process.exit(1);
}

// Check if QStash variables already exist
const hasQStashToken = currentEnv.includes('QSTASH_TOKEN');
const hasCurrentKey = currentEnv.includes('QSTASH_CURRENT_SIGNING_KEY');
const hasNextKey = currentEnv.includes('QSTASH_NEXT_SIGNING_KEY');

if (hasQStashToken && hasCurrentKey && hasNextKey) {
  console.log('✅ QStash environment variables already configured!');
  process.exit(0);
}

// Add QStash variables
const qstashVars = `

# QStash Configuration (Get these from https://console.upstash.com/qstash)
QSTASH_TOKEN=your_qstash_token_here
QSTASH_CURRENT_SIGNING_KEY=your_current_signing_key_here
QSTASH_NEXT_SIGNING_KEY=your_next_signing_key_here

# Vercel URL (automatically set in production, manual for local testing)
VERCEL_URL=http://localhost:3000`;

try {
  fs.writeFileSync(envPath, currentEnv + qstashVars);
  console.log('✅ QStash environment variables added to .env.local');
  
  console.log('\n📋 Next Steps:');
  console.log('1. Visit https://console.upstash.com/qstash to get your QStash credentials');
  console.log('2. Replace the placeholder values in .env.local with your actual tokens');
  console.log('3. Deploy to Vercel: vercel --prod');
  console.log('4. Visit /admin to start the QStash scheduler (runs every 3 minutes)');
  
  console.log('\n🔑 Required QStash Setup:');
  console.log('• QSTASH_TOKEN: Your QStash API token');
  console.log('• QSTASH_CURRENT_SIGNING_KEY: Current signing key for verification');
  console.log('• QSTASH_NEXT_SIGNING_KEY: Next signing key for rotation');
  
  console.log('\n⚡ Benefits of QStash vs Vercel Cron:');
  console.log('• No limit on number of scheduled jobs');
  console.log('• Automatic retries on failures');
  console.log('• Better error handling and monitoring');
  console.log('• Signature verification for security');
  
} catch (error) {
  console.error('❌ Error updating .env.local:', error.message);
}
