import { NextRequest, NextResponse } from 'next/server';
import { parkingScraper } from '@/lib/scraper';
import { insertGarageReading, initializeDatabase } from '@/lib/database';

// Initialize database on first run
let dbInitialized = false;

async function ensureDbInitialized() {
  if (!dbInitialized) {
    try {
      await initializeDatabase();
      dbInitialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await ensureDbInitialized();

    console.log('Starting garage data scraping...');
    
    // Scrape current garage data
    const scrapedData = await parkingScraper.scrapeGarageData();
    
    if (scrapedData.length === 0) {
      return NextResponse.json(
        { error: 'No garage data found' },
        { status: 404 }
      );
    }

    // Convert to database format and insert
    const readings = parkingScraper.convertToGarageReadings(scrapedData);
    const insertedCount = await Promise.all(
      readings.map(reading => insertGarageReading(reading))
    );

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      garages_updated: scrapedData.length,
      data: scrapedData.map(garage => ({
        garage_id: garage.garage_id,
        garage_name: garage.garage_name,
        occupied_percentage: garage.occupied_percentage,
        address: garage.address
      }))
    };

    console.log(`Successfully scraped and stored data for ${scrapedData.length} garages`);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error in scrape endpoint:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to scrape garage data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for manual testing
export async function GET(request: NextRequest) {
  try {
    const healthCheck = await parkingScraper.healthCheck();
    
    return NextResponse.json({
      ...healthCheck,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
