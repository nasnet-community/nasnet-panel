/**
 * TrafficHistoryChart Component
 *
 * Recharts-based area chart for displaying traffic history.
 */

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { TrafficHistoryChartProps, CounterHistoryEntry } from './types';

/**
 * Format timestamp for chart X-axis
 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Format bytes with SI units for Y-axis
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
}

/**
 * Custom tooltip component
 */
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0].payload as CounterHistoryEntry;
  const date = new Date(data.timestamp);

  return (
    <div className="bg-background border border-border rounded-lg shadow-lg p-3">
      <p className="text-sm font-medium text-foreground mb-2">
        {date.toLocaleString()}
      </p>
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Bytes:</span> {formatBytes(data.bytes)}
        </p>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Packets:</span> {data.packets.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

/**
 * TrafficHistoryChart - Displays traffic data over time
 *
 * Uses Recharts AreaChart with gradient fill.
 */
export function TrafficHistoryChart({
  data,
  height = 300,
  className = '',
}: TrafficHistoryChartProps) {
  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center bg-muted/30 rounded-lg ${className}`}
        style={{ height }}
      >
        <p className="text-sm text-muted-foreground">No traffic data available</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorBytes" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4972BA" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#4972BA" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatTime}
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatBytes}
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="bytes"
            stroke="#4972BA"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorBytes)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
