/**
 * BandwidthChartDesktop - Desktop presenter for bandwidth chart
 * 300px height, full controls, hover tooltips
 * Follows ADR-018 (Headless + Platform Presenters pattern)
 */

import { memo } from 'react';
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
import type { BandwidthChartPresenterProps } from './types';

/**
 * Chart configuration constants
 */
const CHART_HEIGHT = 300;
const TX_COLOR = '#3B82F6'; // Blue for upload
const RX_COLOR = '#22C55E'; // Green for download

/**
 * BandwidthChartDesktop component
 *
 * Desktop presenter with:
 * - 300px chart height
 * - Full controls visible in header
 * - Hover tooltips
 * - Reduced-motion support
 * - Screen reader accessible data table
 *
 * @param props - Component props
 */
export const BandwidthChartDesktop = memo<BandwidthChartPresenterProps>(
  ({ deviceId, className, hookOverride }) => {
    const prefersReducedMotion = useReducedMotion();

    // Get chart preferences from Zustand store
    const { timeRange, interfaceId, setTimeRange, setInterfaceId } =
      useChartPreferencesStore();

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
              <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
              <InterfaceFilter
                routerId={deviceId}
                value={interfaceId}
                onChange={setInterfaceId}
              />
            </div>
          </div>

          {/* Current rates display */}
          <div className="mt-2 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: TX_COLOR }}
                aria-hidden="true"
              />
              <span className="text-muted-foreground">TX:</span>
              <span className="font-medium tabular-nums">
                {formatBitrate(currentRates.tx)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: RX_COLOR }}
                aria-hidden="true"
              />
              <span className="text-muted-foreground">RX:</span>
              <span className="font-medium tabular-nums">
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
          />
        </CardContent>
      </Card>
    );
  }
);

BandwidthChartDesktop.displayName = 'BandwidthChartDesktop';
