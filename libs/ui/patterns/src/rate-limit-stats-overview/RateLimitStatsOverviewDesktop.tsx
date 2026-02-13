/**
 * RateLimitStatsOverviewDesktop Component
 * Desktop layout with 3-column grid for stats overview
 *
 * NAS-7.11: Implement Connection Rate Limiting
 */

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, Download, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@nasnet/ui/primitives';
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Alert,
  AlertDescription,
} from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';
import type { RateLimitStatsOverviewProps } from './types';
import { useRateLimitStatsOverview } from './use-rate-limit-stats-overview';
import { POLLING_INTERVAL_CONFIGS } from './types';

/**
 * Formats timestamp for chart X-axis (hourly format: HH:mm)
 */
function formatChartTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Custom tooltip for timeline chart
 */
function ChartTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  return (
    <div className="rounded-md border bg-popover p-3 shadow-md">
      <p className="mb-2 text-sm font-medium">{formatChartTime(data.timestamp)}</p>
      <div className="flex items-center gap-2 text-sm">
        <div className="h-3 w-3 rounded-full bg-[hsl(var(--category-firewall))]" />
        <span className="text-muted-foreground">Blocked:</span>
        <span className="font-mono font-semibold">{data.count.toLocaleString()}</span>
      </div>
    </div>
  );
}

/**
 * RateLimitStatsOverviewDesktop Component
 *
 * Desktop layout with 3-column grid:
 * - Left: Total blocked counter with trend indicator
 * - Center: 24-hour timeline chart (Recharts BarChart)
 * - Right: Top 5 blocked IPs list
 *
 * Features:
 * - Dense data presentation
 * - Grid layout optimized for wide screens
 * - Recharts BarChart with hourly buckets
 * - Polling interval selector
 * - Export to CSV button
 *
 * @example
 * ```tsx
 * <RateLimitStatsOverviewDesktop routerId="192.168.1.1" />
 * ```
 */
export function RateLimitStatsOverviewDesktop(props: RateLimitStatsOverviewProps) {
  const { className } = props;
  const { state, actions } = useRateLimitStatsOverview(props);

  // Loading state
  if (state.loading) {
    return (
      <div className={cn('grid grid-cols-3 gap-6', className)}>
        <Skeleton className="h-[200px]" />
        <Skeleton className="h-[200px]" />
        <Skeleton className="h-[200px]" />
      </div>
    );
  }

  // Error state
  if (state.error) {
    return (
      <Alert variant="destructive" className={className}>
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

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Rate Limiting Statistics</h3>
        <div className="flex items-center gap-3">
          {/* Polling interval selector */}
          <Select value={pollingInterval} onValueChange={actions.setPollingInterval}>
            <SelectTrigger className="w-[180px]" aria-label="Update interval">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(POLLING_INTERVAL_CONFIGS) as Array<keyof typeof POLLING_INTERVAL_CONFIGS>).map(
                (interval) => {
                  const config = POLLING_INTERVAL_CONFIGS[interval];
                  return (
                    <SelectItem key={interval} value={interval}>
                      <div className="flex flex-col">
                        <span className="font-medium">{config.label}</span>
                        <span className="text-xs text-muted-foreground">{config.description}</span>
                      </div>
                    </SelectItem>
                  );
                }
              )}
            </SelectContent>
          </Select>

          {/* Refresh button */}
          <Button variant="outline" size="sm" onClick={actions.refresh} aria-label="Refresh statistics">
            <RefreshCw className="h-4 w-4" />
          </Button>

          {/* Export CSV button */}
          <Button variant="outline" size="sm" onClick={actions.exportToCsv} aria-label="Export to CSV">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* 3-column grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left: Total blocked counter with trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Blocked Connections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-4xl font-mono font-bold tabular-nums">
                {stats.totalBlocked.toLocaleString()}
              </div>
              {trend !== 0 && (
                <div
                  className={cn(
                    'flex items-center gap-2 text-sm',
                    trend > 0 ? 'text-red-600' : 'text-green-600'
                  )}
                >
                  {trend > 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span className="font-medium">
                    {Math.abs(trend).toLocaleString()} from last hour
                  </span>
                </div>
              )}
              {state.lastUpdated && (
                <p className="text-xs text-muted-foreground">
                  Last updated: {state.lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Center: 24-hour timeline chart */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">24-Hour Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                No activity data available
              </div>
            ) : (
              <div className="h-[200px] w-full" role="img" aria-label="24-hour blocked connections timeline">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      opacity={0.3}
                    />
                    <XAxis
                      dataKey="timestamp"
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      tickFormatter={formatChartTime}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      width={50}
                      tickLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar
                      dataKey="count"
                      fill="hsl(var(--category-firewall))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top blocked IPs list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Top 5 Blocked IP Addresses</CardTitle>
        </CardHeader>
        <CardContent>
          {topBlockedIPs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No blocked IPs yet</p>
          ) : (
            <div className="space-y-2">
              {topBlockedIPs.map((ip, index) => (
                <div
                  key={ip.address}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      {index + 1}
                    </div>
                    <span className="font-mono text-sm font-medium">{ip.address}</span>
                    <span className="text-xs text-muted-foreground">({ip.list})</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">
                      {ip.blockCount.toLocaleString()} blocks
                    </div>
                    {ip.timeout && (
                      <div className="text-xs text-muted-foreground">
                        Timeout: {ip.timeout}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live region for accessibility */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        Rate limiting statistics updated. Total blocked: {stats.totalBlocked.toLocaleString()}.
        {trend !== 0 && ` Trend: ${trend > 0 ? 'increasing' : 'decreasing'} by ${Math.abs(trend)}.`}
      </div>
    </div>
  );
}
