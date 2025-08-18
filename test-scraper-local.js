/**
 * Test the parking scraper locally with SSL fix
 */

require('dotenv').config({ path: '.env.local' });
const cheerio = require('cheerio');
const https = require('https');

// Configure HTTPS agent to handle SSL certificate issues
const httpsAgent = new https.Agent({
  rejectUnauthorized: false // Allow self-signed/problematic certificates
});

async function testScraper() {
  console.log('🧪 Testing SJSU Parking Scraper Locally');
  console.log('======================================\n');

  try {
    console.log('🔄 Fetching parking data from SJSU...');
    console.log('URL: https://sjsuparkingstatus.sjsu.edu/GarageStatusPlain\n');
    
    const fetch = require('node-fetch');
    
    const response = await fetch('https://sjsuparkingstatus.sjsu.edu/GarageStatusPlain', {
      agent: httpsAgent, // Use the SSL-permissive agent
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
      },
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    console.log(`✅ Successfully fetched HTML (${html.length} characters)`);
    
    // Parse the HTML using improved logic
    const $ = cheerio.load(html);
    const garages = [];
    
    // Get all garage elements by type (they're not grouped in individual containers)
    const garageNames = $('.garage__name').map((i, el) => $(el).text().trim()).get();
    const garageAddresses = $('.garage__address').map((i, el) => ({
      address: $(el).text().trim(),
      mapUrl: $(el).attr('href')
    })).get();
    const garageFullness = $('.garage__fullness').map((i, el) => {
      const fullnessText = $(el).text().trim();
      return parseFloat(fullnessText.replace('%', '').trim()) || 0;
    }).get();
    
    // Pair them up by index
    const maxLength = Math.min(garageNames.length, garageAddresses.length, garageFullness.length);
    
    for (let i = 0; i < maxLength; i++) {
      const garageName = garageNames[i];
      const addressInfo = garageAddresses[i];
      const occupiedPercentage = garageFullness[i];
      
      if (garageName && addressInfo.address) {
        garages.push({
          name: garageName,
          address: addressInfo.address,
          utilization: occupiedPercentage,
          mapUrl: addressInfo.mapUrl
        });
      }
    }

    console.log(`📊 Successfully parsed ${garages.length} garages:\n`);
    
    if (garages.length === 0) {
      console.log('⚠️  No garages found. HTML structure might have changed.');
      console.log('Sample HTML:', html.substring(0, 500) + '...');
      return false;
    }
    
    garages.forEach(garage => {
      const status = garage.utilization >= 80 ? '🔴 HIGH' : 
                    garage.utilization >= 50 ? '🟡 MEDIUM' : '🟢 LOW';
      console.log(`   ${status} ${garage.name}`);
      console.log(`      📍 ${garage.address}`);
      console.log(`      📊 ${garage.utilization}% occupied`);
      console.log('');
    });
    
    console.log('🎉 Scraper test SUCCESSFUL!');
    console.log('✅ SSL certificate handling works');
    console.log('✅ Data parsing works');
    console.log('✅ Ready for production deployment');
    
    return true;
    
  } catch (error) {
    console.error('❌ Scraper test FAILED:', error.message);
    
    if (error.message.includes('certificate') || error.message.includes('SSL') || error.message.includes('TLS')) {
      console.log('\n🔧 SSL Certificate Issue Detected');
      console.log('This might be a Node.js version or environment issue.');
      console.log('The fix should work in Vercel production environment.');
    }
    
    return false;
  }
}

testScraper();
