/**
 * BandwidthChart Component
 * Historical bandwidth visualization with recharts
 *
 * NAS-6.9: Implement Interface Traffic Statistics (Task 5)
 */

import React, { useMemo, forwardRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Brush,
  Legend,
  ReferenceDot,
  CartesianGrid,
} from 'recharts';
import { useInterfaceStatsHistoryQuery } from '@nasnet/api-client/queries';
import { Skeleton, Alert, AlertDescription } from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';
import { AlertCircle } from 'lucide-react';
import type { StatsTimeRangeInput } from '@nasnet/api-client/generated';

/**
 * Props for BandwidthChart component
 */
export interface BandwidthChartProps {
  /** Router ID */
  routerId: string;
  /** Interface ID */
  interfaceId: string;
  /** Interface display name */
  interfaceName: string;
  /** Time range for historical data */
  timeRange: StatsTimeRangeInput;
  /** Aggregation interval (e.g., '5m', '1h') */
  interval?: string;
  /** Show legend */
  showLegend?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Formats bytes to human-readable bandwidth string
 */
function formatBandwidth(bytesPerSec: number): string {
  if (bytesPerSec === 0) return '0 bps';

  const bitsPerSec = bytesPerSec * 8;
  const k = 1000;
  const sizes = ['bps', 'Kbps', 'Mbps', 'Gbps', 'Tbps'];

  const i = Math.floor(Math.log(bitsPerSec) / Math.log(k));
  const value = bitsPerSec / Math.pow(k, i);

  return `${value.toFixed(2)} ${sizes[i]}`;
}

/**
 * Formats timestamp for chart display
 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formats timestamp with date for tooltip
 */
function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Custom tooltip for bandwidth chart
 */
const BandwidthTooltip = React.memo(function BandwidthTooltip({
  active,
  payload,
  label,
}: any) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className={cn('rounded-md border border-border bg-card p-component-sm shadow-md')}>
      <p className="mb-component-sm text-sm font-medium text-foreground">{formatDateTime(label)}</p>
      <div className="space-y-component-sm">
        {payload.map((entry: any) => (
          <div key={entry.dataKey} className="flex items-center gap-component-sm text-sm">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-mono font-semibold">
              {formatBandwidth(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

/**
 * BandwidthChart Component
 *
 * Displays historical interface bandwidth data as a line chart with:
 * - TX and RX bandwidth lines
 * - Peak markers for highest values
 * - Zoom and pan controls (Brush)
 * - Interactive tooltip with precise values
 * - Responsive design for mobile/desktop
 * - Accessibility support (ARIA labels)
 *
 * @description Visual analysis of historical interface traffic patterns with interactive zoom, pan, and peak detection for bandwidth troubleshooting
 *
 * @example
 * ```tsx
 * const timeRange = {
 *   start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
 *   end: new Date().toISOString(),
 * };
 *
 * <BandwidthChart
 *   routerId="router-1"
 *   interfaceId="ether1"
 *   interfaceName="ether1 - WAN"
 *   timeRange={timeRange}
 *   interval="5m"
 * />
 * ```
 */
const BandwidthChartComponent = forwardRef<HTMLDivElement, BandwidthChartProps>(
  function BandwidthChart(
    {
      routerId,
      interfaceId,
      interfaceName,
      timeRange,
      interval = '5m',
      showLegend = true,
      className,
    },
    ref
  ) {
    // Fetch historical data
    const { data, loading, error } = useInterfaceStatsHistoryQuery({
      routerId,
      interfaceId,
      timeRange,
      interval,
    });

    // Transform data for recharts
    const chartData = useMemo(() => {
      if (!data?.interfaceStatsHistory?.dataPoints) return [];

      return data.interfaceStatsHistory.dataPoints.map((point) => ({
        time: new Date(point.timestamp).getTime(),
        tx: point.txBytesPerSec,
        rx: point.rxBytesPerSec,
      }));
    }, [data]);

    // Calculate peak values for markers
    const { peakTx, peakRx, peakTxTime, peakRxTime } = useMemo(() => {
      if (chartData.length === 0) {
        return { peakTx: 0, peakRx: 0, peakTxTime: 0, peakRxTime: 0 };
      }

      let maxTx = 0;
      let maxRx = 0;
      let txTime = 0;
      let rxTime = 0;

      for (const point of chartData) {
        if (point.tx > maxTx) {
          maxTx = point.tx;
          txTime = point.time;
        }
        if (point.rx > maxRx) {
          maxRx = point.rx;
          rxTime = point.time;
        }
      }

      return { peakTx: maxTx, peakRx: maxRx, peakTxTime: txTime, peakRxTime: rxTime };
    }, [chartData]);

    // Loading state
    if (loading) {
      return <Skeleton className="h-[400px] w-full" />;
    }

    // Error state
    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load bandwidth chart: {error.message}
          </AlertDescription>
        </Alert>
      );
    }

    // Empty state
    if (chartData.length === 0) {
      return (
        <div className="flex h-[400px] items-center justify-center rounded-[var(--semantic-radius-card)] border border-border border-dashed bg-muted">
          <p className="text-sm text-muted-foreground">
            No data available for the selected time range
          </p>
        </div>
      );
    }

    // Accessibility label
    const ariaLabel = `Bandwidth chart for ${interfaceName}. Peak transmit: ${formatBandwidth(
      peakTx
    )}, Peak receive: ${formatBandwidth(peakRx)}. Chart shows ${
      chartData.length
    } data points.`;

    return (
      <div
        ref={ref}
        className={cn('category-networking', className)}
        role="img"
        aria-label={ariaLabel}
      >
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />

              <XAxis
                dataKey="time"
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={formatTime}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={{ stroke: 'hsl(var(--border))' }}
              />

              <YAxis
                tickFormatter={formatBandwidth}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                width={90}
                tickLine={{ stroke: 'hsl(var(--border))' }}
              />

              <Tooltip content={<BandwidthTooltip />} />

              {showLegend && (
                <Legend
                  wrapperStyle={{
                    paddingTop: '20px',
                    fontSize: '14px',
                  }}
                />
              )}

              {/* TX Line (Upload) */}
              <Line
                type="monotone"
                dataKey="tx"
                name="TX (Upload)"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2 }}
                isAnimationActive={false}
              />

              {/* RX Line (Download) */}
              <Line
                type="monotone"
                dataKey="rx"
                name="RX (Download)"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2 }}
                isAnimationActive={false}
              />

              {/* Peak TX Marker */}
              <ReferenceDot
                x={peakTxTime}
                y={peakTx}
                r={5}
                fill="hsl(var(--chart-1))"
                stroke="hsl(var(--background))"
                strokeWidth={2}
                label={{
                  value: 'Peak TX',
                  position: 'top',
                  fill: 'hsl(var(--chart-1))',
                  fontSize: 11,
                }}
              />

              {/* Peak RX Marker */}
              <ReferenceDot
                x={peakRxTime}
                y={peakRx}
                r={5}
                fill="hsl(var(--chart-2))"
                stroke="hsl(var(--background))"
                strokeWidth={2}
                label={{
                  value: 'Peak RX',
                  position: 'top',
                  fill: 'hsl(var(--chart-2))',
                  fontSize: 11,
                }}
              />

              {/* Zoom/Pan Brush */}
              <Brush
                dataKey="time"
                height={30}
                stroke="hsl(var(--primary))"
                fill="hsl(var(--muted))"
                tickFormatter={formatTime}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }
);

BandwidthChartComponent.displayName = 'BandwidthChart';

export const BandwidthChart = React.memo(BandwidthChartComponent);
