"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { format, parseISO } from "date-fns";

interface ChartDataPoint {
  timestamp: string;
  avg_utilization?: number | null;
  max_utilization?: number | null;
  min_utilization?: number | null;
  last_utilization?: number | null;
  predicted_utilization?: number | null;
}

interface ParkingChartProps {
  title: string;
  data: ChartDataPoint[];
  predictions?: ChartDataPoint[];
  showMinMax?: boolean;
  timeFormat?: string;
  height?: number;
}

export function ParkingChart({
  title,
  data,
  predictions = [],
  showMinMax = false,
  timeFormat = "MMM dd HH:mm",
  height = 400,
}: ParkingChartProps) {
  // Combine historical data with predictions
  const combinedData = [
    ...data.map((d) => ({
      ...d,
      timestamp: d.timestamp,
      type: "historical" as const,
    })),
    ...predictions.map((d) => ({
      ...d,
      timestamp: d.timestamp,
      type: "prediction" as const,
    })),
  ].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const formatTooltipValue = (value: any, name: string) => {
    if (value === null || value === undefined || isNaN(Number(value)))
      return ["--", name];
    return [`${Number(value).toFixed(1)}%`, name];
  };

  const formatTooltipLabel = (timestamp: string) => {
    try {
      return format(parseISO(timestamp), "MMM dd, yyyy HH:mm");
    } catch {
      return timestamp;
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-card-foreground mb-2">
            {formatTooltipLabel(label)}
          </p>
          {payload.map((item: any, index: number) => (
            <div
              key={index}
              className="flex justify-between items-center gap-4"
            >
              <span
                className="text-sm flex items-center gap-2"
                style={{ color: item.color }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.name}:
              </span>
              <span className="font-medium text-card-foreground">
                {formatTooltipValue(item.value, "")[0]}
              </span>
            </div>
          ))}
          {dataPoint.type === "prediction" && (
            <div className="mt-2 pt-2 border-t border-border">
              <span className="text-xs text-muted-foreground">Predicted</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (combinedData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Parking utilization over time{" "}
          {predictions.length > 0 && "(including predictions)"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          {showMinMax ? (
            <AreaChart data={combinedData} isAnimationActive={false}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(timestamp) => {
                  try {
                    return format(parseISO(timestamp), timeFormat);
                  } catch {
                    return timestamp;
                  }
                }}
              />
              <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
              <Tooltip content={<CustomTooltip />} />

              <Area
                type="monotone"
                dataKey="max_utilization"
                stackId="1"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.1}
                name="Max Utilization"
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="min_utilization"
                stackId="1"
                stroke="#82ca9d"
                fill="#82ca9d"
                fillOpacity={0.1}
                name="Min Utilization"
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="avg_utilization"
                stroke="#ffc658"
                strokeWidth={2}
                dot={false}
                name="Average Utilization"
                isAnimationActive={false}
              />
            </AreaChart>
          ) : (
            <LineChart data={combinedData} isAnimationActive={false}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(timestamp) => {
                  try {
                    return format(parseISO(timestamp), timeFormat);
                  } catch {
                    return timestamp;
                  }
                }}
              />
              <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
              <Tooltip content={<CustomTooltip />} />

              <Line
                type="monotone"
                dataKey="avg_utilization"
                stroke="#8884d8"
                strokeWidth={2}
                dot={false}
                name="Current Utilization"
                connectNulls={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="last_utilization"
                stroke="#82ca9d"
                strokeWidth={2}
                dot={false}
                name="Last Reading"
                connectNulls={false}
                isAnimationActive={false}
              />
              {predictions.length > 0 && (
                <Line
                  type="monotone"
                  dataKey="predicted_utilization"
                  stroke="#ff7c7c"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Prediction"
                  connectNulls={true}
                  isAnimationActive={false}
                />
              )}
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
