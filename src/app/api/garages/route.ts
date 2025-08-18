import { NextRequest, NextResponse } from 'next/server';
import { getLatestReadings } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const latest = await getLatestReadings();
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      garages: latest.map(garage => ({
        garage_id: garage.garage_id,
        garage_name: garage.garage_name,
        address: garage.address,
        occupied_percentage: garage.occupied_percentage,
        capacity: garage.capacity,
        occupied_spaces: garage.occupied_spaces,
        last_updated: garage.timestamp
      }))
    });
    
  } catch (error) {
    console.error('Error fetching garage data:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch garage data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
