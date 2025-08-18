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
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">
                SJSU Parking Dashboard
              </h1>
              <p className="text-lg text-muted-foreground flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Real-time garage utilization and predictions
              </p>
            </div>
            <div className="flex items-center gap-4 mt-4 lg:mt-0">
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Button onClick={refreshData} disabled={loading} size="sm">
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  onClick={() => window.open('/status', '_blank')}
                  variant="outline"
                  size="sm"
                >
                  System Status
                </Button>
              </div>
            </div>
          </div>

          {/* Overall Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Garages</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{garages.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active parking facilities
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Utilization</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(avgUtilization ?? 0).toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  Across all garages
                </p>
              </CardContent>
            </Card>

            {totalSpaces > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{occupiedSpaces} / {totalSpaces}</div>
                  <p className="text-xs text-muted-foreground">
                    Occupied / Total spaces
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="detailed">Detailed View</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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

            <TabsContent value="detailed" className="space-y-6">
              {garages.length > 0 && (
                <>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {garages.map(garage => (
                      <Button
                        key={garage.garage_id}
                        variant={selectedGarage === garage.garage_id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedGarage(garage.garage_id)}
                      >
                        {garage.garage_name}
                      </Button>
                    ))}
                  </div>

                  {selectedGarage && historicalData[selectedGarage] && (
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
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              {selectedGarage && trends[selectedGarage] && (
                <Card>
                  <CardHeader>
                    <CardTitle>
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
                        <Badge variant={
                          trends[selectedGarage].trend === 'increasing' ? 'destructive' :
                          trends[selectedGarage].trend === 'decreasing' ? 'default' : 'secondary'
                        }>
                          {trends[selectedGarage].trend}
                          {trends[selectedGarage].change_percentage !== 0 && 
                            ` (${(trends[selectedGarage].change_percentage ?? 0).toFixed(1)}%)`
                          }
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Peak Hours</h4>
                        <div className="flex flex-wrap gap-1">
                          {trends[selectedGarage].peak_hours.map(hour => (
                            <Badge key={hour} variant="outline" className="text-xs">
                              {hour}:00
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Off-Peak Hours</h4>
                        <div className="flex flex-wrap gap-1">
                          {trends[selectedGarage].off_peak_hours.map(hour => (
                            <Badge key={hour} variant="outline" className="text-xs">
                              {hour}:00
                            </Badge>
                          ))}
                        </div>
                      </div>
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
