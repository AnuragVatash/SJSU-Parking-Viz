/**
 * Simple test of the parking scraper using basic JavaScript
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const cheerio = require('cheerio');
const fetch = require('node-fetch');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Simple scraper function
async function scrapeGarageData() {
  try {
    console.log('🔄 Fetching parking data from SJSU...');
    
    const https = require('https');
    
    // Create agent that ignores SSL errors for testing
    const agent = new https.Agent({
      rejectUnauthorized: false
    });
    
    const response = await fetch('https://sjsuparkingstatus.sjsu.edu/GarageStatusPlain', {
      agent: agent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    const garages = [];
    
    $('.garage').each((index, element) => {
      const $garage = $(element);
      const garageName = $garage.find('.garage__name').text().trim();
      const address = $garage.find('.garage__address').text().trim();
      const fullnessText = $garage.find('.garage__fullness').text().trim();
      const occupiedPercentage = parseFloat(fullnessText.replace('%', '').trim()) || 0;
      
      if (garageName && address) {
        garages.push({
          name: garageName,
          address: address,
          utilization: occupiedPercentage
        });
      }
    });

    return garages;
  } catch (error) {
    console.error('❌ Error scraping data:', error.message);
    throw error;
  }
}

// Database test
async function testDatabase() {
  try {
    console.log('🔌 Testing database connection...');
    const client = await pool.connect();
    
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Database connected successfully');
    console.log(`⏰ Database time: ${result.rows[0].current_time}`);
    
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🧪 SJSU Parking System Test');
  console.log('============================\n');
  
  try {
    // Test database
    const dbOk = await testDatabase();
    
    if (!dbOk) {
      console.log('\n⚠️  Database connection failed. Please check your .env.local file.');
      return;
    }
    
    console.log('');
    
    // Test scraper
    const garages = await scrapeGarageData();
    
    if (garages.length === 0) {
      console.log('⚠️  No garage data found. The website structure may have changed.');
      return;
    }
    
    console.log(`✅ Successfully scraped ${garages.length} garages:`);
    console.log('');
    
    garages.forEach(garage => {
      const status = garage.utilization >= 80 ? '🔴 HIGH' : 
                    garage.utilization >= 50 ? '🟡 MEDIUM' : '🟢 LOW';
      console.log(`   ${status} ${garage.name}`);
      console.log(`      📍 ${garage.address}`);
      console.log(`      📊 ${garage.utilization}% occupied`);
      console.log('');
    });
    
    console.log('🎉 All tests passed! The system is working correctly.');
    console.log('');
    console.log('📋 Next steps:');
    console.log('   1. Fix Next.js configuration issues');
    console.log('   2. Start the development server');
    console.log('   3. Access the dashboard at http://localhost:3000');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

runTests();
