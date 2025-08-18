import { NextRequest, NextResponse } from 'next/server';
import { forecaster } from '@/lib/forecasting';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const garageId = searchParams.get('garage_id');
    const minutesParam = searchParams.get('minutes');
    const forecastMinutes = minutesParam ? parseInt(minutesParam) : 60;

    if (!garageId) {
      return NextResponse.json(
        { error: 'garage_id parameter is required' },
        { status: 400 }
      );
    }

    if (forecastMinutes < 1 || forecastMinutes > 1440) {
      return NextResponse.json(
        { error: 'minutes parameter must be between 1 and 1440' },
        { status: 400 }
      );
    }

    const predictions = await forecaster.seasonalNaiveForecast(garageId, forecastMinutes);
    
    return NextResponse.json({
      success: true,
      garage_id: garageId,
      forecast_minutes: forecastMinutes,
      predictions: predictions,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating forecast:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate forecast',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Batch forecast endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const forecastMinutes = body.minutes || 60;

    if (forecastMinutes < 1 || forecastMinutes > 1440) {
      return NextResponse.json(
        { error: 'minutes must be between 1 and 1440' },
        { status: 400 }
      );
    }

    const allPredictions = await forecaster.batchForecast(forecastMinutes);
    
    // Group predictions by garage
    const predictionsByGarage = allPredictions.reduce((acc, prediction) => {
      if (!acc[prediction.garage_id]) {
        acc[prediction.garage_id] = [];
      }
      acc[prediction.garage_id].push(prediction);
      return acc;
    }, {} as Record<string, typeof allPredictions>);

    return NextResponse.json({
      success: true,
      forecast_minutes: forecastMinutes,
      total_predictions: allPredictions.length,
      garages: Object.keys(predictionsByGarage).length,
      predictions_by_garage: predictionsByGarage,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating batch forecast:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate batch forecast',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
