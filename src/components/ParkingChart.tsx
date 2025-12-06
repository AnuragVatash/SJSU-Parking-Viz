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
          <CardTitle id={`chart-${title.replace(/\s+/g, '-').toLowerCase()}`}>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="flex items-center justify-center h-64 text-muted-foreground"
            role="status"
            aria-live="polite"
            aria-label="No chart data available"
          >
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartId = `chart-${title.replace(/\s+/g, '-').toLowerCase()}`;
  const chartDescription = `Interactive chart showing parking utilization data over time${predictions.length > 0 ? ', including predictions' : ''}. Use keyboard navigation to explore data points.`;

  return (
    <Card>
      <CardHeader>
        <CardTitle id={chartId}>{title}</CardTitle>
        <CardDescription>
          Parking utilization over time{" "}
          {predictions.length > 0 && "(including predictions)"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          role="img"
          aria-labelledby={chartId}
          aria-describedby={`${chartId}-description`}
          aria-live="polite"
        >
          <div id={`${chartId}-description`} className="sr-only">
            {chartDescription}
          </div>
          <ResponsiveContainer width="100%" height={height}>
            {showMinMax ? (
              <AreaChart
                data={combinedData}
                accessibilityLayer
                aria-label="Area chart showing parking utilization range over time"
              >
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
                  aria-label="Time axis"
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                  aria-label="Utilization percentage axis"
                />
                <Tooltip content={<CustomTooltip />} />

                <Area
                  type="monotone"
                  dataKey="max_utilization"
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.1}
                  name="Max Utilization"
                  aria-label="Maximum utilization area"
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
                  aria-label="Minimum utilization area"
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="avg_utilization"
                  stroke="#ffc658"
                  strokeWidth={2}
                  dot={false}
                  name="Average Utilization"
                  aria-label="Average utilization line"
                  isAnimationActive={false}
                />
              </AreaChart>
            ) : (
              <LineChart
                data={combinedData}
                accessibilityLayer
                aria-label="Line chart showing parking utilization trends over time"
              >
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
                  aria-label="Time axis"
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                  aria-label="Utilization percentage axis"
                />
                <Tooltip content={<CustomTooltip />} />

                <Line
                  type="monotone"
                  dataKey="avg_utilization"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={false}
                  name="Current Utilization"
                  connectNulls={false}
                  aria-label="Current utilization line"
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
                  aria-label="Last reading line"
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
                    connectNulls
                    aria-label="Predicted utilization line (dashed)"
                    isAnimationActive={false}
                  />
                )}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
