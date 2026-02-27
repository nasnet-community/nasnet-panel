/**
 * RateLimitStatsOverviewMobile Component
 * Mobile layout with stacked cards and simplified chart
 *
 * NAS-7.11: Implement Connection Rate Limiting
 */

import { TrendingUp, TrendingDown, Download, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Alert,
  AlertDescription,
  cn,
} from '@nasnet/ui/primitives';

import { POLLING_INTERVAL_CONFIGS } from './types';
import { useRateLimitStatsOverview } from './use-rate-limit-stats-overview';

import type { RateLimitStatsOverviewProps } from './types';

/**
 * Formats timestamp for chart X-axis (mobile: simplified)
 */
function formatChartTime(timestamp: number): string {
  const date = new Date(timestamp);
  return (
    date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      hour12: false,
    }) + 'h'
  );
}

/**
 * Custom tooltip for mobile chart
 */
function ChartTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  return (
    <div className="bg-popover rounded-md border p-2 shadow-md">
      <p className="text-xs font-medium">{new Date(data.timestamp).toLocaleTimeString()}</p>
      <p className="text-sm font-semibold">{data.count.toLocaleString()} blocked</p>
    </div>
  );
}

/**
 * RateLimitStatsOverviewMobile Component
 *
 * Mobile layout with stacked cards optimized for small screens:
 * - Card 1: Total blocked counter with trend
 * - Card 2: 12-hour timeline chart (reduced from 24h)
 * - Card 3: Top 5 blocked IPs list
 *
 * Features:
 * - Stacked layout for narrow screens
 * - 44px touch targets (WCAG AAA)
 * - Simplified chart with fewer data points
 * - Touch-friendly controls
 *
 * @example
 * ```tsx
 * <RateLimitStatsOverviewMobile routerId="192.168.1.1" />
 * ```
 */
export function RateLimitStatsOverviewMobile(props: RateLimitStatsOverviewProps) {
  const { className } = props;
  const { state, actions } = useRateLimitStatsOverview(props);

  // Loading state
  if (state.loading) {
    return (
      <div className={cn('space-y-4', className)}>
        <Skeleton className="h-[150px]" />
        <Skeleton className="h-[200px]" />
        <Skeleton className="h-[250px]" />
      </div>
    );
  }

  // Error state
  if (state.error) {
    return (
      <Alert
        variant="destructive"
        className={className}
      >
        <AlertDescription>{state.error}</AlertDescription>
      </Alert>
    );
  }

  // Empty state
  if (!state.stats) {
    return (
      <Alert className={className}>
        <AlertDescription>No rate limiting statistics available</AlertDescription>
      </Alert>
    );
  }

  const { stats, trend, chartData, pollingInterval } = state;
  const topBlockedIPs = stats.topBlockedIPs.slice(0, 5);

  // Reduce chart data to 12 hours for mobile
  const mobileChartData = chartData.slice(-12);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with title */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Rate Limiting Stats</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={actions.refresh}
          aria-label="Refresh statistics"
          className="h-11 w-11"
        >
          <RefreshCw className="h-5 w-5" />
        </Button>
      </div>

      {/* Total blocked counter card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Total Blocked</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="font-mono text-3xl font-bold tabular-nums">
              {stats.totalBlocked.toLocaleString()}
            </div>
            {trend !== 0 && (
              <div
                className={cn(
                  'flex items-center gap-2 text-sm',
                  trend > 0 ? 'text-red-600' : 'text-green-600'
                )}
              >
                {trend > 0 ?
                  <TrendingUp className="h-4 w-4" />
                : <TrendingDown className="h-4 w-4" />}
                <span className="font-medium">
                  {Math.abs(trend).toLocaleString()} from last hour
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 12-hour timeline chart card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">12-Hour Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {mobileChartData.length === 0 ?
            <div className="text-muted-foreground flex h-[180px] items-center justify-center text-sm">
              No activity data
            </div>
          : <div
              className="h-[180px] w-full"
              role="img"
              aria-label="12-hour blocked connections timeline"
            >
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={mobileChartData}
                  margin={{ top: 5, right: 0, bottom: 5, left: 0 }}
                >
                  <XAxis
                    dataKey="timestamp"
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={formatChartTime}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar
                    dataKey="count"
                    fill="hsl(var(--category-firewall))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          }
        </CardContent>
      </Card>

      {/* Top blocked IPs card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Top Blocked IPs</CardTitle>
        </CardHeader>
        <CardContent>
          {topBlockedIPs.length === 0 ?
            <p className="text-muted-foreground text-sm">No blocked IPs yet</p>
          : <div className="space-y-2">
              {topBlockedIPs.map((ip, index) => (
                <div
                  key={ip.address}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-muted flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-mono text-sm font-medium">{ip.address}</div>
                      <div className="text-muted-foreground text-xs">{ip.list}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{ip.blockCount.toLocaleString()}</div>
                    <div className="text-muted-foreground text-xs">blocks</div>
                  </div>
                </div>
              ))}
            </div>
          }
        </CardContent>
      </Card>

      {/* Controls: Polling interval + Export */}
      <div className="flex flex-col gap-3">
        {/* Polling interval selector */}
        <div>
          <label
            htmlFor="polling-interval-mobile"
            className="mb-2 block text-sm font-medium"
          >
            Update Interval
          </label>
          <Select
            value={pollingInterval}
            onValueChange={actions.setPollingInterval}
          >
            <SelectTrigger
              id="polling-interval-mobile"
              className="h-11 w-full"
              aria-label="Update interval"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(
                Object.keys(POLLING_INTERVAL_CONFIGS) as Array<
                  keyof typeof POLLING_INTERVAL_CONFIGS
                >
              ).map((interval) => {
                const config = POLLING_INTERVAL_CONFIGS[interval];
                return (
                  <SelectItem
                    key={interval}
                    value={interval}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{config.label}</span>
                      <span className="text-muted-foreground text-xs">{config.description}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Export CSV button (44px touch target) */}
        <Button
          variant="outline"
          size="lg"
          onClick={actions.exportToCsv}
          className="h-11 w-full"
          aria-label="Export statistics to CSV"
        >
          <Download className="mr-2 h-5 w-5" />
          Export CSV
        </Button>
      </div>

      {/* Live region for accessibility */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        Rate limiting statistics updated. Total blocked: {stats.totalBlocked.toLocaleString()}.
        {trend !== 0 && ` Trend: ${trend > 0 ? 'increasing' : 'decreasing'} by ${Math.abs(trend)}.`}
      </div>
    </div>
  );
}
