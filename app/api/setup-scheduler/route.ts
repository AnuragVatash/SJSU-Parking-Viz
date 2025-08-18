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

    const qstash = new Client({ token: process.env.QSTASH_TOKEN! });

    // Build a proper absolute destination URL
    // Vercel provides VERCEL_URL as host-only (no scheme)
    const fromEnv = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
    const vercelHost = process.env.VERCEL_URL;
    const siteUrl = fromEnv
      ? fromEnv
      : vercelHost
        ? `https://${vercelHost}`
        : undefined;

    if (!siteUrl) {
      return NextResponse.json(
        { error: 'SITE_URL/VERCEL_URL not set. Provide NEXT_PUBLIC_SITE_URL or SITE_URL in env.' },
        { status: 400 }
      );
    }

    if (siteUrl.includes('localhost') || siteUrl.includes('127.0.0.1')) {
      return NextResponse.json(
        { error: 'Destination cannot be localhost. Use your deployed Vercel URL.' },
        { status: 400 }
      );
    }

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
      destination: `${siteUrl}/api/scrape`,
      method: 'POST',
      // With verifySignatureAppRouter, we don't need custom auth headers
      cron: '*/3 * * * *',
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
