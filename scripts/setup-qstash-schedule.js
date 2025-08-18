/**
 * One-time script to create QStash schedule for SJSU parking scraper
 */

require('dotenv').config({ path: '.env.local' });

async function setupQStashSchedule() {
  console.log('🚀 Setting up QStash Schedule for SJSU Parking Scraper');
  console.log('==================================================\n');
  
  const CRON_SECRET = process.env.CRON_SECRET;
  const BASE_URL = process.env.VERCEL_URL || 'http://localhost:3000';
  
  if (BASE_URL.includes('localhost')) {
    console.log('⚠️  WARNING: QStash cannot call localhost URLs!');
    console.log('   You must deploy to Vercel first, then run this setup.');
    console.log('   1. Deploy: vercel --prod');
    console.log('   2. Set VERCEL_URL environment variable');
    console.log('   3. Run this script again\n');
    return;
  }
  
  if (!CRON_SECRET) {
    console.error('❌ CRON_SECRET not found in .env.local');
    console.log('Please make sure your .env.local file has CRON_SECRET set');
    return;
  }
  
  console.log('📋 Configuration:');
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   CRON_SECRET: ${CRON_SECRET ? 'Found' : 'Missing'}`);
  console.log(`   QStash Token: ${process.env.QSTASH_TOKEN ? 'Found' : 'Missing'}`);
  console.log('');
  
  try {
    console.log('🔧 Creating QStash schedule...');
    
    const response = await fetch(`${BASE_URL}/api/setup-scheduler`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ QStash schedule created successfully!');
      console.log('');
      console.log('📊 Schedule Details:');
      console.log(`   Schedule ID: ${result.scheduleId}`);
      console.log(`   Frequency: ${result.cron} (every 3 minutes)`);
      console.log(`   Daily scrapes: ${result.frequency}`);
      console.log('');
      console.log('🎉 Your SJSU parking scraper is now running 24/7!');
      console.log('');
      console.log('📈 What to expect:');
      console.log('   • Data collection starts immediately');
      console.log('   • QStash dashboard will show activity within 5 minutes');
      console.log('   • Parking data updates every 3 minutes');
      console.log('   • System runs automatically 24/7');
      
    } else {
      console.log('❌ Failed to create QStash schedule');
      console.log('Response:', result);
      
      if (result.error) {
        console.log('\n🔍 Troubleshooting:');
        if (result.error.includes('QSTASH_TOKEN')) {
          console.log('   • Check that QSTASH_TOKEN is set correctly');
          console.log('   • Get token from https://console.upstash.com/qstash');
        }
        if (result.error.includes('Unauthorized')) {
          console.log('   • Check that CRON_SECRET matches your environment variable');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error setting up QStash schedule:', error.message);
    console.log('\n🔍 Common issues:');
    console.log('   • Make sure development server is running (pnpm dev)');
    console.log('   • Check that all environment variables are set');
    console.log('   • Verify QStash credentials are correct');
  }
}

// Check current status first
async function checkStatus() {
  try {
    console.log('📊 Checking current QStash status...\n');
    
    const response = await fetch('http://localhost:3000/api/setup-scheduler');
    const status = await response.json();
    
    if (status.configured) {
      console.log('✅ QStash is configured');
      console.log(`   Active schedules: ${status.totalSchedules}`);
      console.log(`   Scraping schedules: ${status.scrapingSchedules}`);
      console.log(`   Status: ${status.isRunning ? 'Running' : 'Not running'}`);
      
      if (status.isRunning) {
        console.log('\n🎉 QStash schedule already exists and is running!');
        console.log('Check your QStash dashboard: https://console.upstash.com/qstash');
        return true;
      }
    } else {
      console.log('⚠️  QStash not yet configured');
    }
    
    return false;
  } catch (error) {
    console.error('Error checking status:', error.message);
    return false;
  }
}

async function main() {
  const alreadyRunning = await checkStatus();
  
  if (!alreadyRunning) {
    console.log('🚀 Proceeding with QStash schedule setup...\n');
    await setupQStashSchedule();
  }
  
  console.log('\n📋 Next Steps:');
  console.log('1. Visit QStash dashboard: https://console.upstash.com/qstash');
  console.log('2. Check "Schedules" tab for your new schedule');
  console.log('3. Monitor "Logs" tab for activity (starts within 3 minutes)');
  console.log('4. Visit your dashboard: http://localhost:3000');
  console.log('5. Check system status: http://localhost:3000/status');
}

main();
