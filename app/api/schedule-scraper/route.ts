import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@upstash/qstash';

const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
});

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === 'start') {
      // Schedule the scraping job to run every minute
      const scheduleId = await qstash.schedules.create({
        destination: `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/scrape`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CRON_SECRET}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ scheduled: true }),
        cron: '*/3 * * * *', // Every 3 minutes
      });
      
      return NextResponse.json({
        success: true,
        message: 'Parking data scraper scheduled successfully',
        scheduleId: scheduleId
      });
    }
    
    if (action === 'stop' && request.nextUrl.searchParams.get('scheduleId')) {
      const scheduleId = request.nextUrl.searchParams.get('scheduleId')!;
      await qstash.schedules.delete(scheduleId);
      
      return NextResponse.json({
        success: true,
        message: 'Parking data scraper stopped',
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid action. Use "start" or "stop".' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Error managing scraper schedule:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to manage scraper schedule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Get current schedules
export async function GET(request: NextRequest) {
  try {
    const schedules = await qstash.schedules.list();
    
    return NextResponse.json({
      success: true,
      schedules: schedules.map(schedule => ({
        scheduleId: schedule.scheduleId,
        cron: schedule.cron,
        destination: schedule.destination,
        created: schedule.createdAt
      }))
    });
    
  } catch (error) {
    console.error('Error fetching schedules:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch schedules',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
