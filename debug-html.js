/**
 * Debug script to see the actual HTML structure
 */

require('dotenv').config({ path: '.env.local' });
const cheerio = require('cheerio');
const https = require('https');
const fs = require('fs');

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

async function debugHTML() {
  console.log('🔍 Debugging SJSU Parking HTML Structure');
  console.log('=======================================\n');

  try {
    const fetch = require('node-fetch');
    
    const response = await fetch('https://sjsuparkingstatus.sjsu.edu/GarageStatusPlain', {
      agent: httpsAgent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const html = await response.text();
    
    // Save HTML for inspection
    fs.writeFileSync('debug-parking.html', html);
    console.log('✅ HTML saved to debug-parking.html for inspection');
    
    const $ = cheerio.load(html);
    
    console.log('🔍 HTML Structure Analysis:');
    console.log(`Total HTML length: ${html.length} characters`);
    console.log(`Number of .garage elements: ${$('.garage').length}`);
    console.log(`Number of .garage__name elements: ${$('.garage__name').length}`);
    console.log(`Number of .garage__address elements: ${$('.garage__address').length}`);
    console.log(`Number of .garage__fullness elements: ${$('.garage__fullness').length}`);
    
    console.log('\n📋 Detected Elements:');
    
    // Check each garage element individually
    $('.garage').each((index, element) => {
      const $garage = $(element);
      console.log(`\nGarage Element ${index + 1}:`);
      console.log(`  HTML: ${$garage.html().substring(0, 200)}...`);
    });
    
    // Look for garage names
    $('.garage__name').each((index, element) => {
      console.log(`\nGarage Name ${index + 1}: "${$(element).text().trim()}"`);
    });
    
    // Look for addresses
    $('.garage__address').each((index, element) => {
      console.log(`\nGarage Address ${index + 1}: "${$(element).text().trim()}"`);
    });
    
    // Look for fullness
    $('.garage__fullness').each((index, element) => {
      console.log(`\nGarage Fullness ${index + 1}: "${$(element).text().trim()}"`);
    });
    
    console.log('\n🎯 This will help us fix the parsing logic!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugHTML();
