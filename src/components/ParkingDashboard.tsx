"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GarageCard } from "./GarageCard";
import { ParkingChart } from "./ParkingChart";
import { RefreshCw, Activity, TrendingUp, MapPin, Clock } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface GarageData {
  garage_id: string;
  garage_name: string;
  address: string;
  occupied_percentage: number;
  capacity?: number;
  occupied_spaces?: number;
  last_updated: string;
}

interface ForecastData {
  garage_id: string;
  timestamp: string;
  predicted_utilization: number;
  confidence_interval: {
    lower: number;
    upper: number;
  };
  method: string;
}

interface TrendData {
  trend: 'increasing' | 'decreasing' | 'stable';
  change_percentage: number | null | undefined;
  peak_hours: number[];
  off_peak_hours: number[];
}

interface HistoricalDataPoint {
  timestamp: string;
  avg_utilization: number | null;
  max_utilization: number | null;
  min_utilization: number | null;
  last_utilization: number | null;
}

export function ParkingDashboard() {
  const [garages, setGarages] = useState<GarageData[]>([]);
  const [forecasts, setForecasts] = useState<Record<string, ForecastData[]>>({});
  const [trends, setTrends] = useState<Record<string, TrendData>>({});
  const [historicalData, setHistoricalData] = useState<Record<string, HistoricalDataPoint[]>>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [selectedGarage, setSelectedGarage] = useState<string>('');

  const fetchGarageData = async () => {
    try {
      const response = await fetch('/api/garages');
      const data = await response.json();
      
      if (data.success) {
        setGarages(data.garages);
        setLastUpdated(new Date());
        
        // Set first garage as selected if none selected
        if (!selectedGarage && data.garages.length > 0) {
          setSelectedGarage(data.garages[0].garage_id);
        }
      }
    } catch (error) {
      console.error('Error fetching garage data:', error);
    }
  };

  const fetchForecast = async (garageId: string) => {
    try {
      const response = await fetch(`/api/forecast?garage_id=${garageId}&minutes=180`);
      const data = await response.json();
      
      if (data.success) {
        setForecasts(prev => ({
          ...prev,
          [garageId]: data.predictions
        }));
      }
    } catch (error) {
      console.error('Error fetching forecast:', error);
    }
  };

  const fetchTrends = async (garageId: string) => {
    try {
      const response = await fetch(`/api/trends?garage_id=${garageId}&days=7`);
      const data = await response.json();
      
      if (data.success) {
        setTrends(prev => ({
          ...prev,
          [garageId]: data.trend_analysis
        }));
        
        setHistoricalData(prev => ({
          ...prev,
          [garageId]: data.historical_data
        }));
      }
    } catch (error) {
      console.error('Error fetching trends:', error);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await fetchGarageData();
    
    // Fetch additional data for each garage
    garages.forEach(garage => {
      fetchForecast(garage.garage_id);
      fetchTrends(garage.garage_id);
    });
    
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(refreshData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Fetch additional data when selected garage changes
  useEffect(() => {
    if (selectedGarage) {
      fetchForecast(selectedGarage);
      fetchTrends(selectedGarage);
    }
  }, [selectedGarage]);

  const getOverallStats = () => {
    if (garages.length === 0) return { totalSpaces: 0, occupiedSpaces: 0, avgUtilization: 0 };
    
    const totalSpaces = garages.reduce((sum, g) => sum + (g.capacity || 0), 0);
    const occupiedSpaces = garages.reduce((sum, g) => sum + (g.occupied_spaces || 0), 0);
    const avgUtilization = garages.reduce((sum, g) => sum + g.occupied_percentage, 0) / garages.length;
    
    return { totalSpaces, occupiedSpaces, avgUtilization };
  };

  const { totalSpaces, occupiedSpaces, avgUtilization } = getOverallStats();

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-6 px-4">
          <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8" role="banner">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2" id="dashboard-title">
                SJSU Parking Dashboard
              </h1>
              <p className="text-lg text-muted-foreground flex items-center gap-2" aria-describedby="dashboard-description">
                <Activity className="h-5 w-5" aria-hidden="true" />
                <span id="dashboard-description">Real-time garage utilization and predictions</span>
              </p>
            </div>
            <nav className="flex items-center gap-4 mt-4 lg:mt-0" role="navigation" aria-label="Dashboard controls">
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-4 w-4" aria-hidden="true" />
                <time aria-live="polite" aria-label="Last updated time">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </time>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Button
                  onClick={refreshData}
                  disabled={loading}
                  size="sm"
                  aria-label={loading ? "Refreshing data..." : "Refresh dashboard data"}
                  aria-describedby="refresh-status"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
                  <span id="refresh-status">{loading ? 'Refreshing...' : 'Refresh'}</span>
                </Button>
                <Button
                  onClick={() => window.open('/status', '_blank')}
                  variant="outline"
                  size="sm"
                  aria-label="Open system status page in new tab"
                >
                  System Status
                </Button>
              </div>
            </nav>
          </header>

          {/* Overall Stats */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8" aria-labelledby="stats-heading">
            <h2 id="stats-heading" className="sr-only">Overall Parking Statistics</h2>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Garages</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" aria-label={`${garages.length} total garages`}>
                  {garages.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active parking facilities
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Utilization</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" aria-label={`Average utilization ${(avgUtilization ?? 0).toFixed(1)} percent`}>
                  {(avgUtilization ?? 0).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all garages
                </p>
              </CardContent>
            </Card>

            {totalSpaces > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" aria-label={`${occupiedSpaces} occupied out of ${totalSpaces} total spaces`}>
                    {occupiedSpaces} / {totalSpaces}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Occupied / Total spaces
                  </p>
                </CardContent>
              </Card>
            )}
          </section>

          <Tabs defaultValue="overview" className="space-y-6" aria-labelledby="dashboard-navigation">
            <h2 id="dashboard-navigation" className="sr-only">Dashboard Navigation</h2>
            <TabsList className="grid w-full grid-cols-3" role="tablist" aria-label="Dashboard views">
              <TabsTrigger value="overview" aria-label="Overview of all parking garages">
                Overview
              </TabsTrigger>
              <TabsTrigger value="detailed" aria-label="Detailed view with charts and predictions">
                Detailed View
              </TabsTrigger>
              <TabsTrigger value="analytics" aria-label="Analytics and usage patterns">
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6" role="tabpanel" aria-labelledby="overview-tab">
              <h3 id="overview-tab" className="sr-only">Overview - All Parking Garages</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" role="grid" aria-label="Parking garage overview cards">
                {garages.map(garage => {
                  const trend = trends[garage.garage_id];
                  const forecast = forecasts[garage.garage_id];
                  const nextHourPrediction = forecast && forecast.length > 0
                    ? forecast.find(f => new Date(f.timestamp).getTime() > Date.now() + 60 * 60 * 1000)?.predicted_utilization
                    : undefined;

                  return (
                    <GarageCard
                      key={garage.garage_id}
                      {...garage}
                      trend={trend?.trend}
                      nextHourPrediction={nextHourPrediction}
                    />
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="detailed" className="space-y-6" role="tabpanel" aria-labelledby="detailed-tab">
              <h3 id="detailed-tab" className="sr-only">Detailed View - Charts and Predictions</h3>
              {garages.length > 0 && (
                <>
                  <nav className="flex flex-wrap gap-2 mb-4" role="navigation" aria-label="Garage selection">
                    {garages.map(garage => (
                      <Button
                        key={garage.garage_id}
                        variant={selectedGarage === garage.garage_id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedGarage(garage.garage_id)}
                        aria-pressed={selectedGarage === garage.garage_id}
                        aria-label={`Select ${garage.garage_name} for detailed view`}
                      >
                        {garage.garage_name}
                      </Button>
                    ))}
                  </nav>

                  {selectedGarage && historicalData[selectedGarage] && (
                    <section aria-labelledby="chart-title">
                      <ParkingChart
                        title={`${garages.find(g => g.garage_id === selectedGarage)?.garage_name} - 7 Day History`}
                        data={historicalData[selectedGarage]}
                        predictions={forecasts[selectedGarage]?.map(f => ({
                          timestamp: f.timestamp,
                          predicted_utilization: f.predicted_utilization
                        }))}
                        timeFormat="MMM dd HH:mm"
                        height={400}
                      />
                    </section>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6" role="tabpanel" aria-labelledby="analytics-tab">
              <h3 id="analytics-tab" className="sr-only">Analytics - Usage Patterns and Trends</h3>
              {selectedGarage && trends[selectedGarage] && (
                <Card>
                  <CardHeader>
                    <CardTitle id="analytics-title">
                      {garages.find(g => g.garage_id === selectedGarage)?.garage_name} Analytics
                    </CardTitle>
                    <CardDescription>
                      7-day trend analysis and usage patterns
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Trend:</span>
                        <Badge
                          variant={
                            trends[selectedGarage].trend === 'increasing' ? 'destructive' :
                            trends[selectedGarage].trend === 'decreasing' ? 'default' : 'secondary'
                          }
                          aria-label={`Current trend: ${trends[selectedGarage].trend}${
                            trends[selectedGarage].change_percentage !== 0 ?
                            ` with ${(trends[selectedGarage].change_percentage ?? 0).toFixed(1)} percent change` : ''
                          }`}
                        >
                          {trends[selectedGarage].trend}
                          {trends[selectedGarage].change_percentage !== 0 &&
                            ` (${(trends[selectedGarage].change_percentage ?? 0).toFixed(1)}%)`
                          }
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <section aria-labelledby="peak-hours-heading">
                        <h4 id="peak-hours-heading" className="font-medium mb-2">Peak Hours</h4>
                        <div className="flex flex-wrap gap-1" role="list" aria-label="Peak usage hours">
                          {trends[selectedGarage].peak_hours.map(hour => (
                            <Badge key={hour} variant="outline" className="text-xs" role="listitem">
                              {hour}:00
                            </Badge>
                          ))}
                        </div>
                      </section>

                      <section aria-labelledby="off-peak-hours-heading">
                        <h4 id="off-peak-hours-heading" className="font-medium mb-2">Off-Peak Hours</h4>
                        <div className="flex flex-wrap gap-1" role="list" aria-label="Off-peak usage hours">
                          {trends[selectedGarage].off_peak_hours.map(hour => (
                            <Badge key={hour} variant="outline" className="text-xs" role="listitem">
                              {hour}:00
                            </Badge>
                          ))}
                        </div>
                      </section>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </TooltipProvider>
  );
}
