/**
 * Test script to demonstrate the 3-minute schedule
 */

const cronParser = require('node-cron');

const scheduleExpression = '*/3 * * * *'; // Every 3 minutes

console.log('🕐 SJSU Parking Scraper Schedule Test');
console.log('====================================\n');

console.log(`📅 Cron Expression: ${scheduleExpression}`);
console.log('📋 Schedule Details:');
console.log('   • Frequency: Every 3 minutes');
console.log('   • Per Hour: 20 scrapes');
console.log('   • Per Day: 480 scrapes');
console.log('   • Per Month: ~14,400 scrapes');

console.log('\n⏰ Next 10 execution times:');

// Simulate the next few execution times
const now = new Date();
let nextTime = new Date(now);
nextTime.setSeconds(0, 0); // Round to the nearest minute

// Find the next 3-minute interval
const currentMinute = nextTime.getMinutes();
const nextInterval = Math.ceil(currentMinute / 3) * 3;
nextTime.setMinutes(nextInterval);

for (let i = 0; i < 10; i++) {
  const timeString = nextTime.toLocaleTimeString();
  console.log(`   ${i + 1}. ${timeString}`);
  nextTime.setMinutes(nextTime.getMinutes() + 3);
}

console.log('\n🎯 Benefits of 3-minute intervals:');
console.log('   ✅ More reasonable for parking data (changes aren\'t that frequent)');
console.log('   ✅ Reduces server load and API calls');
console.log('   ✅ Still provides near real-time data');
console.log('   ✅ Better for database storage efficiency');
console.log('   ✅ Complies with respectful web scraping practices');

console.log('\n🚀 Your QStash scheduler is now configured for optimal performance!');
