/**
 * BandwidthChartDesktop - Desktop presenter for bandwidth chart
 * 300px height, full controls, hover tooltips
 * Follows ADR-018 (Headless + Platform Presenters pattern)
 */

import { memo, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';
import { useReducedMotion } from '@nasnet/ui/layouts';
import { useBandwidthHistory } from './useBandwidthHistory';
import { useChartPreferencesStore } from '../../stores/chart-preferences.store';
import { TimeRangeSelector } from './TimeRangeSelector';
import { InterfaceFilter } from './InterfaceFilter';
import { CustomTooltip } from './CustomTooltip';
import { BandwidthDataTable } from './BandwidthDataTable';
import {
  BandwidthChartSkeleton,
  BandwidthChartError,
  BandwidthChartEmpty,
} from './BandwidthChartSkeleton';
import { formatBitrate, formatXAxis, formatYAxis } from './utils';
import type { BandwidthChartPresenterProps, TimeRange } from './types';

/**
 * Chart configuration constants using semantic design tokens
 */
const CHART_HEIGHT = 300;
// Using semantic tokens: primary for TX (upload), success for RX (download)
const TX_COLOR = 'hsl(var(--primary))'; // Golden Amber for upload emphasis
const RX_COLOR = 'hsl(var(--success))'; // Green for download/received data

/**
 * BandwidthChartDesktop component
 *
 * @description
 * Desktop presenter with 300px chart height, full controls always visible,
 * hover-activated tooltips, and screen reader accessible data table.
 * Memoized to prevent unnecessary re-renders.
 *
 * @param props - Component props with optional hook override for testing
 */
export const BandwidthChartDesktop = memo<BandwidthChartPresenterProps>(
  ({ deviceId, className, hookOverride }) => {
    const prefersReducedMotion = useReducedMotion();

    // Get chart preferences from Zustand store with memoized callbacks
    const { timeRange, interfaceId, setTimeRange, setInterfaceId } =
      useChartPreferencesStore();

    // Memoize callback handlers to maintain referential equality
    const handleTimeRangeChange = useCallback(
      (range: TimeRange) => setTimeRange(range),
      [setTimeRange]
    );

    const handleInterfaceChange = useCallback(
      (id: string) => setInterfaceId(id),
      [setInterfaceId]
    );

    // Fetch bandwidth data (or use hook override for testing)
    const hookData = useBandwidthHistory({
      deviceId,
      timeRange,
      interfaceId,
    });
    const { data, loading, error, refetch } = hookOverride || hookData;

    // Loading state
    if (loading && !data) {
      return <BandwidthChartSkeleton height={CHART_HEIGHT} className={className} />;
    }

    // Error state
    if (error && !data) {
      return (
        <BandwidthChartError
          message={error.message || 'Failed to load bandwidth data'}
          onRetry={refetch}
          className={className}
        />
      );
    }

    // Empty state
    if (!data || data.dataPoints.length === 0) {
      return <BandwidthChartEmpty className={className} />;
    }

    const { dataPoints, currentRates } = data;

    return (
      <Card className={cn('w-full', className)}>
        <CardHeader className="pb-3">
          {/* Title and controls */}
          <div className="flex items-center justify-between">
            <CardTitle>Bandwidth Usage</CardTitle>
            <div className="flex items-center gap-2">
              <TimeRangeSelector
                value={timeRange}
                onChange={handleTimeRangeChange}
              />
              <InterfaceFilter
                routerId={deviceId}
                value={interfaceId}
                onChange={(id: string | null) => setInterfaceId(id)}
              />
            </div>
          </div>

          {/* Current rates display with live region for announcements */}
          <div
            className="mt-2 flex items-center gap-4 text-sm"
            role="region"
            aria-live="polite"
            aria-label="Current bandwidth rates"
          >
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full bg-primary"
                aria-hidden="true"
              />
              <span className="text-muted-foreground">TX:</span>
              <span className="font-medium font-mono">
                {formatBitrate(currentRates.tx)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full bg-success"
                aria-hidden="true"
              />
              <span className="text-muted-foreground">RX:</span>
              <span className="font-medium font-mono">
                {formatBitrate(currentRates.rx)}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Chart visualization */}
          <div
            role="img"
            aria-label="Bandwidth usage graph showing upload and download traffic over time"
            aria-describedby="bandwidth-chart-description"
          >
            <p id="bandwidth-chart-description" className="sr-only">
              Line chart displaying TX (upload) in blue and RX (download) in green.
              Current TX: {formatBitrate(currentRates.tx)}. Current RX:{' '}
              {formatBitrate(currentRates.rx)}.
            </p>

            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <LineChart
                data={dataPoints}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-muted"
                  opacity={0.3}
                />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(ts) => formatXAxis(ts, timeRange)}
                  className="text-xs text-muted-foreground"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tickFormatter={formatYAxis}
                  className="text-xs text-muted-foreground"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '14px' }}
                  iconType="line"
                />
                <Line
                  type="monotone"
                  dataKey="txRate"
                  name="TX (Upload)"
                  stroke={TX_COLOR}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  isAnimationActive={!prefersReducedMotion}
                  animationDuration={prefersReducedMotion ? 0 : 500}
                />
                <Line
                  type="monotone"
                  dataKey="rxRate"
                  name="RX (Download)"
                  stroke={RX_COLOR}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  isAnimationActive={!prefersReducedMotion}
                  animationDuration={prefersReducedMotion ? 0 : 500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Accessible data table (hidden by default, accessible to screen readers) */}
          <BandwidthDataTable
            dataPoints={dataPoints}
            timeRange={timeRange}
            className="mt-4"
          />
        </CardContent>
      </Card>
    );
  }
);

BandwidthChartDesktop.displayName = 'BandwidthChartDesktop';
