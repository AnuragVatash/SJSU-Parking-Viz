import { GarageReading, getHistoricalData, pool } from './database';
import { differenceInMinutes, addMinutes, startOfWeek, getDay, getHours, getMinutes } from 'date-fns';

export interface ForecastPrediction {
  garage_id: string;
  timestamp: Date;
  predicted_utilization: number;
  confidence_interval: {
    lower: number;
    upper: number;
  };
  method: string;
}

export class ParkingForecaster {
  
  // Seasonal Naive Forecasting - predict using same time last week
  async seasonalNaiveForecast(
    garageId: string, 
    forecastMinutes: number = 60
  ): Promise<ForecastPrediction[]> {
    const historicalData = await getHistoricalData(garageId, 14); // Get 2 weeks of data
    
    if (historicalData.length === 0) {
      throw new Error(`No historical data available for garage ${garageId}`);
    }

    const predictions: ForecastPrediction[] = [];
    const now = new Date();

    for (let i = 1; i <= forecastMinutes; i++) {
      const targetTime = addMinutes(now, i);
      const prediction = await this.predictForTimestamp(garageId, targetTime, historicalData);
      predictions.push(prediction);
    }

    return predictions;
  }

  // Predict utilization for a specific timestamp using seasonal naive approach
  private async predictForTimestamp(
    garageId: string,
    targetTime: Date,
    historicalData: GarageReading[]
  ): Promise<ForecastPrediction> {
    
    // Try to find data from the same time last week (7 days ago)
    const lastWeekTime = addMinutes(targetTime, -7 * 24 * 60);
    const exactMatch = this.findClosestReading(historicalData, lastWeekTime, 5); // 5-minute tolerance

    if (exactMatch) {
      return {
        garage_id: garageId,
        timestamp: targetTime,
        predicted_utilization: exactMatch.occupied_percentage,
        confidence_interval: {
          lower: Math.max(0, exactMatch.occupied_percentage - 10),
          upper: Math.min(100, exactMatch.occupied_percentage + 10)
        },
        method: 'seasonal_naive_weekly'
      };
    }

    // Fallback 1: Same day of week, same hour average
    const weekdayHourlyAverage = this.calculateWeekdayHourlyAverage(
      historicalData,
      getDay(targetTime),
      getHours(targetTime)
    );

    if (weekdayHourlyAverage !== null) {
      return {
        garage_id: garageId,
        timestamp: targetTime,
        predicted_utilization: weekdayHourlyAverage,
        confidence_interval: {
          lower: Math.max(0, weekdayHourlyAverage - 15),
          upper: Math.min(100, weekdayHourlyAverage + 15)
        },
        method: 'weekday_hourly_average'
      };
    }

    // Fallback 2: Same time of day average (regardless of weekday)
    const hourlyAverage = this.calculateHourlyAverage(
      historicalData,
      getHours(targetTime)
    );

    if (hourlyAverage !== null) {
      return {
        garage_id: garageId,
        timestamp: targetTime,
        predicted_utilization: hourlyAverage,
        confidence_interval: {
          lower: Math.max(0, hourlyAverage - 20),
          upper: Math.min(100, hourlyAverage + 20)
        },
        method: 'hourly_average'
      };
    }

    // Final fallback: Overall average
    const overallAverage = historicalData.reduce(
      (sum, reading) => sum + reading.occupied_percentage, 0
    ) / historicalData.length;

    return {
      garage_id: garageId,
      timestamp: targetTime,
      predicted_utilization: overallAverage,
      confidence_interval: {
        lower: Math.max(0, overallAverage - 25),
        upper: Math.min(100, overallAverage + 25)
      },
      method: 'overall_average'
    };
  }

  // Find the closest reading to a target timestamp within tolerance
  private findClosestReading(
    data: GarageReading[],
    targetTime: Date,
    toleranceMinutes: number = 10
  ): GarageReading | null {
    let closest: GarageReading | null = null;
    let closestDiff = Infinity;

    for (const reading of data) {
      const diff = Math.abs(differenceInMinutes(reading.timestamp, targetTime));
      
      if (diff <= toleranceMinutes && diff < closestDiff) {
        closest = reading;
        closestDiff = diff;
      }
    }

    return closest;
  }

  // Calculate average utilization for specific weekday and hour
  private calculateWeekdayHourlyAverage(
    data: GarageReading[],
    dayOfWeek: number, // 0 = Sunday, 1 = Monday, etc.
    hour: number
  ): number | null {
    const matchingReadings = data.filter(reading => {
      const readingDay = getDay(reading.timestamp);
      const readingHour = getHours(reading.timestamp);
      return readingDay === dayOfWeek && readingHour === hour;
    });

    if (matchingReadings.length === 0) return null;

    return matchingReadings.reduce(
      (sum, reading) => sum + reading.occupied_percentage, 0
    ) / matchingReadings.length;
  }

  // Calculate average utilization for specific hour (all days)
  private calculateHourlyAverage(
    data: GarageReading[],
    hour: number
  ): number | null {
    const matchingReadings = data.filter(reading => 
      getHours(reading.timestamp) === hour
    );

    if (matchingReadings.length === 0) return null;

    return matchingReadings.reduce(
      (sum, reading) => sum + reading.occupied_percentage, 0
    ) / matchingReadings.length;
  }

  // Get trend analysis for a garage
  async getTrendAnalysis(garageId: string, days: number = 7): Promise<{
    trend: 'increasing' | 'decreasing' | 'stable';
    change_percentage: number;
    peak_hours: number[];
    off_peak_hours: number[];
  }> {
    const data = await getHistoricalData(garageId, days);
    
    if (data.length < 2) {
      return {
        trend: 'stable',
        change_percentage: 0,
        peak_hours: [],
        off_peak_hours: []
      };
    }

    // Calculate trend using simple linear regression
    const n = data.length;
    const xSum = data.reduce((sum, _, i) => sum + i, 0);
    const ySum = data.reduce((sum, reading) => sum + reading.occupied_percentage, 0);
    const xySum = data.reduce((sum, reading, i) => sum + (i * reading.occupied_percentage), 0);
    const x2Sum = data.reduce((sum, _, i) => sum + (i * i), 0);

    const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);
    const changePercentage = (slope * data.length) / (ySum / n) * 100;

    // Determine peak and off-peak hours
    const hourlyAverages = new Map<number, number[]>();
    
    data.forEach(reading => {
      const hour = getHours(reading.timestamp);
      if (!hourlyAverages.has(hour)) {
        hourlyAverages.set(hour, []);
      }
      hourlyAverages.get(hour)!.push(reading.occupied_percentage);
    });

    const avgByHour = Array.from(hourlyAverages.entries()).map(([hour, values]) => ({
      hour,
      average: values.reduce((sum, val) => sum + val, 0) / values.length
    }));

    avgByHour.sort((a, b) => b.average - a.average);
    
    const peakHours = avgByHour.slice(0, Math.ceil(avgByHour.length * 0.3)).map(h => h.hour);
    const offPeakHours = avgByHour.slice(-Math.ceil(avgByHour.length * 0.3)).map(h => h.hour);

    return {
      trend: Math.abs(changePercentage) < 1 ? 'stable' : 
             changePercentage > 0 ? 'increasing' : 'decreasing',
      change_percentage: changePercentage,
      peak_hours: peakHours.sort((a, b) => a - b),
      off_peak_hours: offPeakHours.sort((a, b) => a - b)
    };
  }

  // Batch forecast for all garages
  async batchForecast(forecastMinutes: number = 60): Promise<ForecastPrediction[]> {
    const client = await pool.connect();
    try {
      // Get list of all garages
      const garageResult = await client.query(
        'SELECT DISTINCT garage_id FROM garage_readings ORDER BY garage_id'
      );
      
      const allPredictions: ForecastPrediction[] = [];
      
      for (const row of garageResult.rows) {
        try {
          const predictions = await this.seasonalNaiveForecast(row.garage_id, forecastMinutes);
          allPredictions.push(...predictions);
        } catch (error) {
          console.error(`Failed to forecast for garage ${row.garage_id}:`, error);
        }
      }
      
      return allPredictions;
    } finally {
      client.release();
    }
  }
}

// Export singleton instance
export const forecaster = new ParkingForecaster();
