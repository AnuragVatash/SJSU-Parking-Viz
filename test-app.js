/**
 * Test the core parking scraper functionality
 */

require('dotenv').config({ path: '.env.local' });
const { ParkingScraper } = require('./src/lib/scraper.ts');
const { insertGarageReading, initializeDatabase } = require('./src/lib/database.ts');

async function testApp() {
  console.log('🧪 Testing SJSU Parking App Components');
  console.log('=====================================\n');

  try {
    // Test 1: Database connection
    console.log('1️⃣  Testing database connection...');
    await initializeDatabase();
    console.log('✅ Database connection successful\n');

    // Test 2: Scraper functionality
    console.log('2️⃣  Testing parking data scraper...');
    const scraper = new ParkingScraper();
    const healthCheck = await scraper.healthCheck();
    
    if (healthCheck.success) {
      console.log('✅ Scraper working correctly');
      console.log(`📊 Found ${healthCheck.data.garageCount} garages:`);
      
      healthCheck.data.garages.forEach(garage => {
        const status = garage.utilization >= 80 ? '🔴' : 
                      garage.utilization >= 50 ? '🟡' : '🟢';
        console.log(`   ${status} ${garage.name}: ${garage.utilization}%`);
      });
      
      // Test 3: Database insertion
      console.log('\n3️⃣  Testing database insertion...');
      const scrapedData = await scraper.scrapeGarageData();
      const readings = scraper.convertToGarageReadings(scrapedData);
      
      for (const reading of readings) {
        await insertGarageReading(reading);
      }
      
      console.log(`✅ Successfully inserted ${readings.length} garage readings into database`);
      
      console.log('\n🎉 All core components working correctly!');
      console.log('\n📝 Summary:');
      console.log(`   • Database: Connected (TimescaleDB)`);
      console.log(`   • Scraper: Working (${healthCheck.data.garageCount} garages)`);
      console.log(`   • Data Storage: Working (${readings.length} readings stored)`);
      
    } else {
      console.log('❌ Scraper health check failed:', healthCheck.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('   • Check that .env.local exists with correct DATABASE_URL');
    console.log('   • Verify Neon database is accessible');
    console.log('   • Ensure SJSU parking website is reachable');
  }
}

testApp();
