import { NextRequest, NextResponse } from 'next/server';
import { forecaster } from '@/lib/forecasting';
import { getAggregatedData } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const garageId = searchParams.get('garage_id');
    const daysParam = searchParams.get('days');
    const days = daysParam ? parseInt(daysParam) : 7;

    if (!garageId) {
      return NextResponse.json(
        { error: 'garage_id parameter is required' },
        { status: 400 }
      );
    }

    if (days < 1 || days > 30) {
      return NextResponse.json(
        { error: 'days parameter must be between 1 and 30' },
        { status: 400 }
      );
    }

    // Get trend analysis
    const trendAnalysis = await forecaster.getTrendAnalysis(garageId, days);
    
    // Get aggregated data for visualization
    const hours = days * 24;
    const aggregatedData = await getAggregatedData(garageId, 'hourly', hours);
    
    return NextResponse.json({
      success: true,
      garage_id: garageId,
      analysis_period_days: days,
      trend_analysis: trendAnalysis,
      historical_data: aggregatedData.map(row => ({
        timestamp: row.timestamp,
        avg_utilization: parseFloat(row.avg_utilization || 0),
        max_utilization: parseFloat(row.max_utilization || 0),
        min_utilization: parseFloat(row.min_utilization || 0),
        last_utilization: parseFloat(row.last_utilization || 0)
      })),
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating trend analysis:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate trend analysis',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}