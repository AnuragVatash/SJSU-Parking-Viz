import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@upstash/qstash';

// This runs once after deployment to set up the 24/7 scheduler
export async function POST(request: NextRequest) {
  try {
    // Basic auth check using deployment secret
    const authHeader = request.headers.get('authorization');
    const setupSecret = process.env.SETUP_SECRET || process.env.CRON_SECRET;
    
    if (!setupSecret || authHeader !== `Bearer ${setupSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized - use SETUP_SECRET' },
        { status: 401 }
      );
    }

    const qstash = new Client({
      token: process.env.QSTASH_TOKEN!,
    });

    // Check if schedule already exists
    const existingSchedules = await qstash.schedules.list();
    const hasScrapingSchedule = existingSchedules.some(schedule => 
      schedule.destination.includes('/api/scrape')
    );

    if (hasScrapingSchedule) {
      return NextResponse.json({
        success: true,
        message: 'Scraping schedule already exists - running 24/7 every 3 minutes',
        schedules: existingSchedules.length
      });
    }

    // Create the 24/7 schedule
    const schedule = await qstash.schedules.create({
      destination: `${process.env.VERCEL_URL || 'https://your-app.vercel.app'}/api/scrape`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        source: 'qstash-scheduler',
        timestamp: new Date().toISOString()
      }),
      cron: '*/3 * * * *', // Every 3 minutes, 24/7
    });

    return NextResponse.json({
      success: true,
      message: 'SJSU Parking scraper now running 24/7 every 3 minutes!',
      scheduleId: schedule.scheduleId,
      cron: '*/3 * * * *',
      frequency: '480 times per day'
    });

  } catch (error) {
    console.error('Setup scheduler error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to setup scheduler',
      details: error instanceof Error ? error.message : 'Unknown error',
      help: 'Make sure QSTASH_TOKEN is set in your Vercel environment variables'
    }, { status: 500 });
  }
}

// Health check for existing schedules
export async function GET() {
  try {
    if (!process.env.QSTASH_TOKEN) {
      return NextResponse.json({
        configured: false,
        message: 'QStash not configured - missing QSTASH_TOKEN'
      });
    }

    const qstash = new Client({
      token: process.env.QSTASH_TOKEN!,
    });

    const schedules = await qstash.schedules.list();
    const scrapingSchedules = schedules.filter(schedule => 
      schedule.destination.includes('/api/scrape')
    );

    return NextResponse.json({
      configured: true,
      totalSchedules: schedules.length,
      scrapingSchedules: scrapingSchedules.length,
      isRunning: scrapingSchedules.length > 0,
      message: scrapingSchedules.length > 0 
        ? 'Scraper is running 24/7 every 3 minutes' 
        : 'No scraping schedule found',
      schedules: scrapingSchedules.map(s => ({
        id: s.scheduleId,
        cron: s.cron,
        created: new Date(s.createdAt * 1000).toISOString()
      }))
    });

  } catch (error) {
    return NextResponse.json({
      configured: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
