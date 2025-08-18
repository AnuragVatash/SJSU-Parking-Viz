"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Square, RefreshCw, Clock } from "lucide-react";

interface Schedule {
  scheduleId: string;
  cron: string;
  destination: string;
  created: number;
}

export default function AdminPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchSchedules = async () => {
    try {
      const response = await fetch('/api/schedule-scraper');
      const data = await response.json();
      
      if (data.success) {
        setSchedules(data.schedules);
      } else {
        setMessage('Failed to fetch schedules');
      }
    } catch (error) {
      setMessage('Error fetching schedules');
    }
  };

  const startSchedule = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/schedule-scraper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'start' }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage(`✅ Scraper scheduled successfully! ID: ${data.scheduleId}`);
        await fetchSchedules();
      } else {
        setMessage(`❌ Failed to start scheduler: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error starting scheduler: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const stopSchedule = async (scheduleId: string) => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch(`/api/schedule-scraper?scheduleId=${scheduleId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'stop' }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage('✅ Scraper stopped successfully!');
        await fetchSchedules();
      } else {
        setMessage(`❌ Failed to stop scheduler: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error stopping scheduler: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">SJSU Parking Admin</h1>
          <p className="text-muted-foreground">Manage QStash scheduling for parking data collection</p>
        </div>

        {message && (
          <div className="mb-6 p-4 border rounded-lg bg-muted">
            <p className="text-sm">{message}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Control Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Schedule Control
              </CardTitle>
              <CardDescription>
                Start or stop the automated parking data collection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={startSchedule}
                disabled={loading}
                className="w-full"
                variant="default"
              >
                <Play className="h-4 w-4 mr-2" />
                {loading ? 'Starting...' : 'Start Scraper (Every 3 Minutes)'}
              </Button>
              
              <Button 
                onClick={fetchSchedules}
                disabled={loading}
                className="w-full"
                variant="outline"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Status
              </Button>
            </CardContent>
          </Card>

          {/* Active Schedules */}
          <Card>
            <CardHeader>
              <CardTitle>Active Schedules</CardTitle>
              <CardDescription>
                Currently running QStash schedules
              </CardDescription>
            </CardHeader>
            <CardContent>
              {schedules.length === 0 ? (
                <p className="text-muted-foreground text-sm">No active schedules</p>
              ) : (
                <div className="space-y-3">
                  {schedules.map((schedule) => (
                    <div key={schedule.scheduleId} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Badge variant="default" className="mb-1">
                            {schedule.cron}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            ID: {schedule.scheduleId.substring(0, 8)}...
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Created: {new Date(schedule.created * 1000).toLocaleString()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => stopSchedule(schedule.scheduleId)}
                          disabled={loading}
                        >
                          <Square className="h-3 w-3 mr-1" />
                          Stop
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">1. Get QStash Credentials</h3>
              <p className="text-sm text-muted-foreground">
                Visit <a href="https://console.upstash.com/qstash" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  Upstash QStash Console
                </a> to get your tokens.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">2. Update Environment Variables</h3>
              <div className="bg-muted p-3 rounded text-xs font-mono">
                QSTASH_TOKEN=your_token_here<br/>
                QSTASH_CURRENT_SIGNING_KEY=your_current_key<br/>
                QSTASH_NEXT_SIGNING_KEY=your_next_key<br/>
                CRON_SECRET=your_existing_secret
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">3. Deploy and Start</h3>
              <p className="text-sm text-muted-foreground">
                Deploy to Vercel and use the button above to start the scheduler. 
                QStash will call your scraper endpoint every minute with automatic retries.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
