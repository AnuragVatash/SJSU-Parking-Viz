"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Database, Activity } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface SystemStatus {
  configured: boolean;
  totalSchedules?: number;
  scrapingSchedules?: number;
  isRunning?: boolean;
  message: string;
  schedules?: Array<{
    id: string;
    cron: string;
    created: string;
  }>;
}

export default function StatusPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/setup-scheduler');
        const data = await response.json();
        setStatus(data);
      } catch (error) {
        setStatus({
          configured: false,
          message: 'Failed to fetch system status'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    
    // Refresh status every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Checking system status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2">System Status</h1>
            <p className="text-muted-foreground">SJSU Parking Visualization System Health Check</p>
          </div>
          <ThemeToggle />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* QStash Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {status?.configured ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                QStash Scheduler
              </CardTitle>
              <CardDescription>
                Automated parking data collection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Status:</span>
                  <Badge variant={status?.isRunning ? "default" : "destructive"}>
                    {status?.isRunning ? "Running" : "Not Running"}
                  </Badge>
                </div>
                
                {status?.configured && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Schedules:</span>
                      <span className="font-mono">{status.totalSchedules || 0}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Scraping Jobs:</span>
                      <span className="font-mono">{status.scrapingSchedules || 0}</span>
                    </div>
                  </>
                )}
                
                <p className="text-xs text-muted-foreground mt-3">
                  {status?.message}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Schedule Details
              </CardTitle>
              <CardDescription>
                Current running schedules
              </CardDescription>
            </CardHeader>
            <CardContent>
              {status?.schedules && status.schedules.length > 0 ? (
                <div className="space-y-3">
                  {status.schedules.map((schedule) => (
                    <div key={schedule.id} className="border rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{schedule.cron}</Badge>
                        <span className="text-xs text-muted-foreground">Every 3 min</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(schedule.created).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ID: {schedule.id.substring(0, 12)}...
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No active schedules</p>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">3min</div>
                  <div className="text-xs text-muted-foreground">Collection Interval</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">480</div>
                  <div className="text-xs text-muted-foreground">Scrapes per Day</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">24/7</div>
                  <div className="text-xs text-muted-foreground">Always Running</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">4</div>
                  <div className="text-xs text-muted-foreground">SJSU Garages</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Setup Instructions */}
        {!status?.configured && (
          <Card className="mt-6 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
            <CardHeader>
              <CardTitle className="text-orange-800 dark:text-orange-200">Setup Required</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">1. Get QStash Account</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Visit <a href="https://console.upstash.com/qstash" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    Upstash QStash Console
                  </a> and create a free account.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">2. Add Environment Variables to Vercel</h3>
                <div className="bg-muted p-3 rounded text-xs font-mono">
                  QSTASH_TOKEN=your_token_here<br/>
                  QSTASH_CURRENT_SIGNING_KEY=your_current_key<br/>
                  QSTASH_NEXT_SIGNING_KEY=your_next_key
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">3. One-Time Setup</h3>
                <p className="text-sm text-muted-foreground">
                  After deployment, run this command once to start 24/7 scheduling:
                </p>
                <div className="bg-muted p-3 rounded text-xs font-mono mt-2">
                  curl -X POST https://your-app.vercel.app/api/setup-scheduler \<br/>
                  &nbsp;&nbsp;-H "Authorization: Bearer your-cron-secret"
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
