/**
 * Simple test script to verify the parking data scraper functionality
 * Run with: node scripts/test-scraper.js
 */

const { ParkingScraper } = require('../src/lib/scraper.ts');

async function testScraper() {
  console.log('🚀 Testing SJSU Parking Data Scraper');
  console.log('=====================================\n');
  
  const scraper = new ParkingScraper();
  
  try {
    console.log('📡 Performing health check...');
    const healthCheck = await scraper.healthCheck();
    
    if (healthCheck.success) {
      console.log('✅ Scraper is healthy!');
      console.log(`📊 Found ${healthCheck.data.garageCount} garages:`);
      
      healthCheck.data.garages.forEach(garage => {
        const status = garage.utilization >= 80 ? '🔴' : 
                      garage.utilization >= 50 ? '🟡' : '🟢';
        console.log(`  ${status} ${garage.name}: ${garage.utilization}%`);
      });
    } else {
      console.log('❌ Scraper health check failed:', healthCheck.message);
    }
    
    console.log('\n🕒 Checking last updated time...');
    const lastUpdated = await scraper.getLastUpdatedTime();
    
    if (lastUpdated) {
      console.log(`⏰ Last updated: ${lastUpdated.toLocaleString()}`);
    } else {
      console.log('⚠️  Could not determine last updated time');
    }
    
  } catch (error) {
    console.error('❌ Error testing scraper:', error.message);
  }
  
  console.log('\n🏁 Test completed!');
}

// Run the test if this script is executed directly
if (require.main === module) {
  testScraper();
}

module.exports = { testScraper };
