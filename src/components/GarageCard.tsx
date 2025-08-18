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
  occupied_percentage: number;
  capacity?: number;
  occupied_spaces?: number;
  last_updated: string;
  trend?: 'increasing' | 'decreasing' | 'stable';
  nextHourPrediction?: number;
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

  const level = getUtilizationLevel(occupied_percentage);
  const progressColor = getUtilizationColor(level);

  return (
    <Card className="w-full hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            {garage_name}
            {getUtilizationBadge(occupied_percentage)}
          </CardTitle>
          {trend && (
            <Tooltip>
              <TooltipTrigger>
                {getTrendIcon(trend)}
              </TooltipTrigger>
              <TooltipContent>
                <p>Trend: {trend}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <CardDescription className="flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          {address}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold">
              {occupied_percentage.toFixed(1)}%
            </span>
            {capacity && (
              <span className="text-sm text-muted-foreground">
                {Math.round((occupied_percentage * capacity) / 100)} / {capacity} spaces
              </span>
            )}
          </div>
          
          <Progress 
            value={occupied_percentage} 
            className={`h-3 ${progressColor}`}
          />
        </div>

        {nextHourPrediction !== undefined && (
          <div className="pt-2 border-t border-border">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Next hour prediction:</span>
              <span className="font-medium">
                {nextHourPrediction.toFixed(1)}%
                {nextHourPrediction > occupied_percentage ? (
                  <TrendingUp className="inline h-3 w-3 ml-1 text-red-500" />
                ) : nextHourPrediction < occupied_percentage ? (
                  <TrendingDown className="inline h-3 w-3 ml-1 text-green-500" />
                ) : (
                  <Minus className="inline h-3 w-3 ml-1 text-blue-500" />
                )}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          Updated {formatDistanceToNow(new Date(last_updated))} ago
        </div>
      </CardContent>
    </Card>
  );
}
