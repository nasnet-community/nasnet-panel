/**
 * LatencyGraph Component
 *
 * Visualizes ping latency over time using Recharts.
 * Features:
 * - Line chart showing RTT for each ping
 * - Reference lines for warning (100ms) and critical (200ms) thresholds
 * - Gaps in line for timeouts (connectNulls=false)
 * - Responsive container that adapts to parent width
 */

import { memo, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { cn } from '@nasnet/ui/primitives';
import type { PingResult } from './PingTool.types';

/**
 * Props for LatencyGraph component
 */
export interface LatencyGraphProps {
  /** Array of ping results to visualize */
  results: PingResult[];
  /** Optional additional CSS classes */
  className?: string;
}

/**
 * Data point for chart
 */
interface ChartDataPoint {
  seq: number;
  time: number | null;
  target: string;
}

/**
 * Custom tooltip for the latency chart
 *
 * Displays ping result details on hover:
 * - Sequence number
 * - Latency in milliseconds (monospace font for data readability)
 * - Timeout indicator if the ping failed
 *
 * @param active - Whether the tooltip is currently active (hovering over a data point)
 * @param payload - Recharts data payload array
 * @returns Rendered tooltip element or null if not active
 */
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload as ChartDataPoint;

  return (
    <div className="bg-card p-component-sm rounded-md border text-sm shadow-md">
      <div className="font-semibold">Ping #{data.seq}</div>
      {data.time !== null ?
        <div className="text-muted-foreground">
          Latency: <span className="text-foreground font-mono">{data.time.toFixed(1)} ms</span>
        </div>
      : <div className="text-error">Timeout</div>}
    </div>
  );
}

/**
 * LatencyGraph - Visualize ping latency over time
 *
 * Shows latency trend with warning/critical thresholds.
 * Gaps in the line indicate timeouts or failed pings.
 * Uses monospace font for latency data display.
 *
 * @example
 * ```tsx
 * <LatencyGraph
 *   results={[
 *     { seq: 1, time: 12.5, ... },
 *     { seq: 2, time: null, error: 'timeout', ... },
 *     { seq: 3, time: 14.2, ... },
 *   ]}
 * />
 * ```
 */
export const LatencyGraph = memo(function LatencyGraph({ results, className }: LatencyGraphProps) {
  // Memoize tooltip component to prevent unnecessary re-renders
  const memoizedTooltip = useCallback((props: any) => <CustomTooltip {...props} />, []);

  // Transform results into chart data
  const chartData: ChartDataPoint[] = results.map((result) => ({
    seq: result.seq,
    time: result.time,
    target: result.target,
  }));

  if (results.length === 0) {
    return (
      <div
        className={cn(
          'text-muted-foreground rounded-card-sm flex h-64 items-center justify-center border',
          className
        )}
      >
        No data to display. Start a ping test to see the latency graph.
      </div>
    );
  }

  // Calculate Y-axis domain (add 20% padding)
  const validTimes = results.filter((r) => r.time !== null).map((r) => r.time!);
  const maxTime = validTimes.length > 0 ? Math.max(...validTimes) : 100;
  const yMax = Math.max(250, Math.ceil((maxTime * 1.2) / 50) * 50); // Round up to nearest 50

  return (
    <div
      className={cn('w-full', className)}
      role="img"
      aria-label="Latency over time chart showing ping response times"
    >
      <h3 className="mb-2 text-lg font-semibold">Latency Over Time</h3>
      <ResponsiveContainer
        width="100%"
        height={200}
      >
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-muted"
          />
          <XAxis
            dataKey="seq"
            label={{ value: 'Sequence', position: 'insideBottom', offset: -5 }}
            className="text-xs"
          />
          <YAxis
            label={{
              value: 'Latency (ms)',
              angle: -90,
              position: 'insideLeft',
            }}
            domain={[0, yMax]}
            className="text-xs"
          />
          <Tooltip content={memoizedTooltip as any} />

          {/* Reference line at 100ms (warning threshold) */}
          <ReferenceLine
            y={100}
            stroke="hsl(var(--warning))"
            strokeDasharray="5 5"
            label={{ value: 'Slow (100ms)', position: 'right', className: 'text-xs fill-warning' }}
          />

          {/* Reference line at 200ms (critical threshold) */}
          <ReferenceLine
            y={200}
            stroke="hsl(var(--error))"
            strokeDasharray="5 5"
            label={{
              value: 'Critical (200ms)',
              position: 'right',
              className: 'text-xs fill-error',
            }}
          />

          {/* Latency line - connectNulls=false shows gaps for timeouts */}
          <Line
            type="monotone"
            dataKey="time"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            connectNulls={false}
            name="Latency"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

LatencyGraph.displayName = 'LatencyGraph';
