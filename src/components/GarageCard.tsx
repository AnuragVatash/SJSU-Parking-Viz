"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Car, Clock, MapPin, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface GarageCardProps {
  garage_id: string;
  garage_name: string;
  address: string;
  occupied_percentage: number | null | undefined;
  capacity?: number;
  occupied_spaces?: number;
  last_updated: string;
  trend?: 'increasing' | 'decreasing' | 'stable';
  nextHourPrediction?: number | null | undefined;
}

export function GarageCard({
  garage_id,
  garage_name,
  address,
  occupied_percentage,
  capacity,
  occupied_spaces,
  last_updated,
  trend,
  nextHourPrediction
}: GarageCardProps) {
  
  const getUtilizationLevel = (percentage: number): 'low' | 'medium' | 'high' | 'full' => {
    if (percentage >= 95) return 'full';
    if (percentage >= 80) return 'high';
    if (percentage >= 50) return 'medium';
    return 'low';
  };

  const getUtilizationColor = (level: string) => {
    switch (level) {
      case 'full': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getUtilizationBadge = (percentage: number) => {
    const level = getUtilizationLevel(percentage);
    const colors = {
      full: 'destructive',
      high: 'secondary',
      medium: 'outline',
      low: 'default'
    } as const;

    return (
      <Badge variant={colors[level]} className="ml-2">
        {level === 'full' ? 'Full' : 
         level === 'high' ? 'High' : 
         level === 'medium' ? 'Moderate' : 'Available'}
      </Badge>
    );
  };

  const getTrendIcon = (trendType?: string) => {
    switch (trendType) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'decreasing': return <TrendingDown className="h-4 w-4 text-green-500" />;
      case 'stable': return <Minus className="h-4 w-4 text-blue-500" />;
      default: return null;
    }
  };

  const level = getUtilizationLevel(occupied_percentage ?? 0);
  const progressColor = getUtilizationColor(level);

  return (
    <Card className="w-full hover:shadow-lg transition-shadow duration-200" role="article" aria-labelledby={`garage-${garage_id}-title`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle id={`garage-${garage_id}-title`} className="text-lg font-semibold flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" aria-hidden="true" />
            {garage_name}
            {getUtilizationBadge(occupied_percentage ?? 0)}
          </CardTitle>
          {trend && (
            <Tooltip>
              <TooltipTrigger aria-label={`Trend: ${trend}`}>
                {getTrendIcon(trend)}
              </TooltipTrigger>
              <TooltipContent>
                <p>Trend: {trend}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <CardDescription className="flex items-center gap-1" aria-label={`Located at ${address}`}>
          <MapPin className="h-4 w-4" aria-hidden="true" />
          {address}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold" aria-label={`Current utilization: ${(occupied_percentage ?? 0).toFixed(1)} percent`}>
              {(occupied_percentage ?? 0).toFixed(1)}%
            </span>
            {capacity && (
              <span className="text-sm text-muted-foreground">
                {Math.round(((occupied_percentage ?? 0) * capacity) / 100)} / {capacity} spaces
              </span>
            )}
          </div>

          <div
            className="relative h-3 w-full overflow-hidden rounded-full bg-secondary"
            role="meter"
            aria-valuenow={occupied_percentage ?? 0}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Parking utilization meter showing ${(occupied_percentage ?? 0).toFixed(1)} percent`}
          >
            <div
              className={`h-full ${progressColor} transition-all duration-300 ease-in-out`}
              style={{ width: `${occupied_percentage ?? 0}%` }}
            />
          </div>
        </div>

        {nextHourPrediction !== undefined && (
          <div className="pt-2 border-t border-border">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Next hour prediction:</span>
              <span className="font-medium" aria-label={`Predicted utilization: ${(nextHourPrediction ?? 0).toFixed(1)} percent${
                (nextHourPrediction ?? 0) > (occupied_percentage ?? 0) ? ' - increasing' :
                (nextHourPrediction ?? 0) < (occupied_percentage ?? 0) ? ' - decreasing' : ' - stable'
              }`}>
                {(nextHourPrediction ?? 0).toFixed(1)}%
                {(nextHourPrediction ?? 0) > (occupied_percentage ?? 0) ? (
                  <TrendingUp className="inline h-3 w-3 ml-1 text-red-500" aria-label="Trending upward" />
                ) : (nextHourPrediction ?? 0) < (occupied_percentage ?? 0) ? (
                  <TrendingDown className="inline h-3 w-3 ml-1 text-green-500" aria-label="Trending downward" />
                ) : (
                  <Minus className="inline h-3 w-3 ml-1 text-blue-500" aria-label="Stable trend" />
                )}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" aria-hidden="true" />
          <time
            dateTime={last_updated}
            aria-label={`Last updated ${formatDistanceToNow(new Date(last_updated))} ago`}
          >
            Updated {formatDistanceToNow(new Date(last_updated))} ago
          </time>
        </div>
      </CardContent>
    </Card>
  );
}
