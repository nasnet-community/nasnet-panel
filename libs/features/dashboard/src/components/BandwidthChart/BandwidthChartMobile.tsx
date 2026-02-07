/**
 * BandwidthChartMobile - Mobile presenter for bandwidth chart
 * 200px height, simplified controls, tap tooltips
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
 * Chart configuration constants for mobile
 */
const CHART_HEIGHT = 200;
const TX_COLOR = '#3B82F6'; // Blue for upload
const RX_COLOR = '#22C55E'; // Green for download

/**
 * BandwidthChartMobile component
 *
 * Mobile presenter with:
 * - 200px chart height (compact)
 * - Simplified axis labels (fewer ticks)
 * - Tap-optimized tooltips
 * - Reduced-motion support
 * - Collapsible controls for space efficiency
 *
 * @param props - Component props
 */
export const BandwidthChartMobile = memo<BandwidthChartPresenterProps>(
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
          {/* Title */}
          <CardTitle className="text-base">Bandwidth Usage</CardTitle>

          {/* Current rates display */}
          <div className="mt-2 flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: TX_COLOR }}
                aria-hidden="true"
              />
              <span className="text-muted-foreground">TX:</span>
              <span className="font-medium tabular-nums">
                {formatBitrate(currentRates.tx)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: RX_COLOR }}
                aria-hidden="true"
              />
              <span className="text-muted-foreground">RX:</span>
              <span className="font-medium tabular-nums">
                {formatBitrate(currentRates.rx)}
              </span>
            </div>
          </div>

          {/* Controls (stacked for mobile) */}
          <div className="mt-3 flex flex-col gap-2">
            <TimeRangeSelector
              value={timeRange}
              onChange={setTimeRange}
              className="w-full"
            />
            <InterfaceFilter
              routerId={deviceId}
              value={interfaceId}
              onChange={setInterfaceId}
              className="w-full"
            />
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Chart visualization */}
          <div
            role="img"
            aria-label="Bandwidth usage graph showing upload and download traffic over time"
            aria-describedby="bandwidth-chart-description-mobile"
          >
            <p id="bandwidth-chart-description-mobile" className="sr-only">
              Line chart displaying TX (upload) in blue and RX (download) in green.
              Current TX: {formatBitrate(currentRates.tx)}. Current RX:{' '}
              {formatBitrate(currentRates.rx)}. Tap on chart for details.
            </p>

            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <LineChart
                data={dataPoints}
                margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-muted"
                  opacity={0.2}
                />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(ts) => formatXAxis(ts, timeRange)}
                  className="text-xs text-muted-foreground"
                  tick={{ fontSize: 10 }}
                  // Fewer ticks for mobile
                  interval="preserveStartEnd"
                  minTickGap={50}
                />
                <YAxis
                  tickFormatter={formatYAxis}
                  className="text-xs text-muted-foreground"
                  tick={{ fontSize: 10 }}
                  width={40}
                  // Fewer ticks for mobile
                  interval="preserveStartEnd"
                />
                <Tooltip
                  content={<CustomTooltip />}
                  // Optimize for touch
                  allowEscapeViewBox={{ x: false, y: true }}
                />
                <Line
                  type="monotone"
                  dataKey="txRate"
                  name="TX"
                  stroke={TX_COLOR}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }} // Larger touch target for mobile
                  isAnimationActive={!prefersReducedMotion}
                  animationDuration={prefersReducedMotion ? 0 : 500}
                />
                <Line
                  type="monotone"
                  dataKey="rxRate"
                  name="RX"
                  stroke={RX_COLOR}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }} // Larger touch target for mobile
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

BandwidthChartMobile.displayName = 'BandwidthChartMobile';
