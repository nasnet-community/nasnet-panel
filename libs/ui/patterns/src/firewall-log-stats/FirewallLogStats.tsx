/**
 * FirewallLogStats Pattern Component
 *
 * Statistics panel for firewall log viewer with:
 * - Top Blocked IPs list (top 10)
 * - Top Ports list (top 10)
 * - Action Distribution pie chart
 *
 * Implements Headless + Platform Presenters pattern (ADR-018).
 *
 * @example
 * ```tsx
 * import { FirewallLogStats } from '@nasnet/ui/patterns';
 *
 * <FirewallLogStats
 *   logs={firewallLogs}
 *   onAddToBlocklist={(ip) => addToBlocklist(ip)}
 * />
 * ```
 */

import { memo, useMemo } from 'react';

import { Ban, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

import { getServiceByPort } from '@nasnet/core/constants';
import type { FirewallLogEntry } from '@nasnet/core/types';
import { usePlatform } from '@nasnet/ui/layouts';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
} from '@nasnet/ui/primitives';

// ============================================================================
// Types
// ============================================================================

export interface FirewallLogStatsProps {
  /** Firewall log entries to compute stats from */
  logs: FirewallLogEntry[];

  /** Callback when "Add to Blocklist" is clicked */
  onAddToBlocklist?: (ip: string) => void;

  /** Loading state */
  loading?: boolean;

  /** Container className */
  className?: string;
}

interface IPStats {
  ip: string;
  count: number;
  percentage: number;
}

interface PortStats {
  port: number;
  serviceName: string | null;
  count: number;
  percentage: number;
}

interface ActionStats {
  action: string;
  count: number;
  percentage: number;
  color: string;
}

interface ComputedStats {
  topBlockedIPs: IPStats[];
  topPorts: PortStats[];
  actionDistribution: ActionStats[];
  totalLogs: number;
}

// ============================================================================
// Constants
// ============================================================================

// Firewall category accent color (Orange #F97316)
const ACTION_COLORS: Record<string, string> = {
  accept: '#22C55E', // Green - semantic.success
  drop: '#EF4444', // Red - semantic.error
  reject: '#F97316', // Orange - firewall accent
  unknown: '#94A3B8', // Gray - muted
};

const CHART_COLORS = ['#F97316', '#EF4444', '#22C55E', '#94A3B8'];

// ============================================================================
// Headless Hook
// ============================================================================

/**
 * Compute statistics from firewall logs
 */
function useFirewallLogStats(logs: FirewallLogEntry[]): ComputedStats {
  return useMemo(() => {
    const totalLogs = logs.length;

    // Compute top blocked IPs
    const ipCounts = new Map<string, number>();
    logs.forEach((log) => {
      if (log.parsed.action === 'drop' || log.parsed.action === 'reject') {
        const ip = log.parsed.srcIp;
        if (ip) {
          ipCounts.set(ip, (ipCounts.get(ip) || 0) + 1);
        }
      }
    });

    const topBlockedIPs: IPStats[] = Array.from(ipCounts.entries())
      .map(([ip, count]) => ({
        ip,
        count,
        percentage: (count / totalLogs) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Compute top ports
    const portCounts = new Map<number, number>();
    logs.forEach((log) => {
      const port = log.parsed.dstPort;
      if (port) {
        portCounts.set(port, (portCounts.get(port) || 0) + 1);
      }
    });

    const topPorts: PortStats[] = Array.from(portCounts.entries())
      .map(([port, count]) => ({
        port,
        serviceName: getServiceByPort(port),
        count,
        percentage: (count / totalLogs) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Compute action distribution
    const actionCounts = new Map<string, number>();
    logs.forEach((log) => {
      const action = log.parsed.action;
      actionCounts.set(action, (actionCounts.get(action) || 0) + 1);
    });

    const actionDistribution: ActionStats[] = Array.from(actionCounts.entries())
      .map(([action, count]) => ({
        action,
        count,
        percentage: (count / totalLogs) * 100,
        color: ACTION_COLORS[action] || CHART_COLORS[3],
      }))
      .sort((a, b) => b.count - a.count);

    return {
      topBlockedIPs,
      topPorts,
      actionDistribution,
      totalLogs,
    };
  }, [logs]);
}

// ============================================================================
// Desktop Presenter (>=640px)
// ============================================================================

const FirewallLogStatsDesktop = memo(function FirewallLogStatsDesktop({
  logs,
  onAddToBlocklist,
  loading,
  className,
}: FirewallLogStatsProps) {
  const stats = useFirewallLogStats(logs);

  if (loading) {
    return (
      <div className={cn('grid animate-pulse grid-cols-2 gap-3 sm:grid-cols-4', className)}>
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-muted/50 h-20 rounded-lg p-3"
          />
        ))}
      </div>
    );
  }

  if (stats.totalLogs === 0) {
    return (
      <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-4', className)}>
        <div className="bg-muted/50 text-muted-foreground col-span-full rounded-lg p-3 text-center text-sm">
          No firewall logs to display
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Action Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Action Distribution</CardTitle>
          <CardDescription>
            Firewall actions breakdown from {stats.totalLogs.toLocaleString()} log entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer
            width="100%"
            height={300}
          >
            <PieChart>
              <Pie
                data={stats.actionDistribution}
                dataKey="count"
                nameKey="action"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={
                  ((entry: Record<string, unknown>) =>
                    `${entry.action} (${(entry.percentage as number).toFixed(1)}%)`) as any
                }
                labelLine={true}
              >
                {stats.actionDistribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                  color: 'hsl(var(--foreground))',
                }}
                formatter={((value: number) => value.toLocaleString()) as never}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <div className="font-display text-foreground text-lg font-bold">
            {stats.actionDistribution.reduce((sum, a) => sum + a.count, 0)}
          </div>
          <div className="text-muted-foreground mt-1 text-xs">Total Logs</div>
        </div>
        {stats.actionDistribution.map((action) => (
          <div
            key={action.action}
            className="bg-muted/50 rounded-lg p-3 text-center"
          >
            <div
              className="font-display text-lg font-bold"
              style={{ color: action.color }}
            >
              {action.count}
            </div>
            <div className="text-muted-foreground mt-1 text-xs capitalize">{action.action}</div>
          </div>
        ))}
      </div>

      {/* Two-column layout for lists */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Top Blocked IPs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ban className="text-error h-5 w-5" />
              Top Blocked IPs
            </CardTitle>
            <CardDescription>Most frequently blocked source IP addresses</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topBlockedIPs.length === 0 ?
              <p className="text-muted-foreground py-8 text-center text-sm">No blocked IPs yet</p>
            : <div className="space-y-2">
                {stats.topBlockedIPs.map((ipStat, index) => (
                  <div
                    key={ipStat.ip}
                    className="hover:bg-muted/50 flex items-center justify-between rounded-lg p-3 transition-colors"
                  >
                    <div className="flex flex-1 items-center gap-3">
                      <span className="text-muted-foreground w-6 text-sm font-medium">
                        #{index + 1}
                      </span>
                      <code className="font-mono text-sm">{ipStat.ip}</code>
                      <span className="text-muted-foreground text-xs">
                        ({ipStat.count.toLocaleString()} hits)
                      </span>
                    </div>
                    {onAddToBlocklist && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAddToBlocklist(ipStat.ip)}
                        className="shrink-0"
                      >
                        Add to Blocklist
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            }
          </CardContent>
        </Card>

        {/* Top Ports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="text-primary h-5 w-5" />
              Top Ports
            </CardTitle>
            <CardDescription>Most frequently accessed destination ports</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topPorts.length === 0 ?
              <p className="text-muted-foreground py-8 text-center text-sm">
                No port data available
              </p>
            : <div className="space-y-2">
                {stats.topPorts.map((portStat, index) => (
                  <div
                    key={portStat.port}
                    className="hover:bg-muted/50 flex items-center justify-between rounded-lg p-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground w-6 text-sm font-medium">
                        #{index + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-sm font-semibold">{portStat.port}</code>
                          {portStat.serviceName && (
                            <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs">
                              {portStat.serviceName}
                            </span>
                          )}
                        </div>
                        <span className="text-muted-foreground text-xs">
                          {portStat.count.toLocaleString()} connections
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{portStat.percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            }
          </CardContent>
        </Card>
      </div>
    </div>
  );
});
FirewallLogStatsDesktop.displayName = 'FirewallLogStatsDesktop';

// ============================================================================
// Mobile Presenter (<640px)
// ============================================================================

const FirewallLogStatsMobile = memo(function FirewallLogStatsMobile({
  logs,
  onAddToBlocklist,
  loading,
  className,
}: FirewallLogStatsProps) {
  const stats = useFirewallLogStats(logs);

  if (loading) {
    return (
      <div className={cn('grid animate-pulse grid-cols-2 gap-3', className)}>
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-muted/50 h-20 rounded-lg p-3"
          />
        ))}
      </div>
    );
  }

  if (stats.totalLogs === 0) {
    return (
      <div className={cn('grid grid-cols-2 gap-3', className)}>
        <div className="bg-muted/50 text-muted-foreground col-span-full rounded-lg p-3 text-center text-xs">
          No firewall logs to display
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Action Distribution Chart - Compact */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Action Distribution</CardTitle>
          <CardDescription className="text-xs">
            {stats.totalLogs.toLocaleString()} log entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer
            width="100%"
            height={240}
          >
            <PieChart>
              <Pie
                data={stats.actionDistribution}
                dataKey="count"
                nameKey="action"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={
                  ((entry: Record<string, unknown>) =>
                    `${(entry.percentage as number).toFixed(0)}%`) as any
                }
                labelLine={false}
              >
                {stats.actionDistribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                }}
                formatter={((value: number) => value.toLocaleString()) as never}
              />
              <Legend
                wrapperStyle={{ fontSize: '0.75rem' }}
                iconSize={10}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Blocked IPs - Compact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Ban className="text-error h-4 w-4" />
            Top Blocked IPs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.topBlockedIPs.length === 0 ?
            <p className="text-muted-foreground py-4 text-center text-sm">No blocked IPs yet</p>
          : <div className="space-y-2">
              {stats.topBlockedIPs.slice(0, 5).map((ipStat, index) => (
                <div
                  key={ipStat.ip}
                  className="bg-muted/30 flex flex-col gap-2 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-xs font-medium">
                        #{index + 1}
                      </span>
                      <code className="font-mono text-sm">{ipStat.ip}</code>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {ipStat.count.toLocaleString()}
                    </span>
                  </div>
                  {onAddToBlocklist && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAddToBlocklist(ipStat.ip)}
                      className="h-11 w-full text-sm"
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      Add to Blocklist
                    </Button>
                  )}
                </div>
              ))}
            </div>
          }
        </CardContent>
      </Card>

      {/* Top Ports - Compact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="text-primary h-4 w-4" />
            Top Ports
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.topPorts.length === 0 ?
            <p className="text-muted-foreground py-4 text-center text-sm">No port data available</p>
          : <div className="space-y-2">
              {stats.topPorts.slice(0, 5).map((portStat, index) => (
                <div
                  key={portStat.port}
                  className="bg-muted/30 flex items-center justify-between rounded-lg p-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs font-medium">#{index + 1}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-sm font-semibold">{portStat.port}</code>
                        {portStat.serviceName && (
                          <span className="bg-primary/10 text-primary rounded px-1.5 py-0.5 text-xs">
                            {portStat.serviceName}
                          </span>
                        )}
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {portStat.count.toLocaleString()} connections
                      </span>
                    </div>
                  </div>
                  <div className="text-xs font-semibold">{portStat.percentage.toFixed(1)}%</div>
                </div>
              ))}
            </div>
          }
        </CardContent>
      </Card>
    </div>
  );
});
FirewallLogStatsMobile.displayName = 'FirewallLogStatsMobile';

// ============================================================================
// Tablet Presenter (640-1024px)
// ============================================================================

const FirewallLogStatsTablet = memo(function FirewallLogStatsTablet(props: FirewallLogStatsProps) {
  // Tablet uses a hybrid layout - similar to desktop but with some responsive adjustments
  return <FirewallLogStatsDesktop {...props} />;
});
FirewallLogStatsTablet.displayName = 'FirewallLogStatsTablet';

// ============================================================================
// Main Component (Auto-detecting Platform)
// ============================================================================

/**
 * FirewallLogStats - Display firewall log statistics
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile (<640px): Compact cards with 44px touch targets, stacked layout
 * - Tablet/Desktop (>=640px): Side-by-side layout with detailed stats
 *
 * Features:
 * - Top 10 blocked IPs with "Add to Blocklist" action
 * - Top 10 destination ports with service name lookup
 * - Action distribution pie chart (Orange accent #F97316)
 * - Responsive layouts optimized for each platform
 */
function FirewallLogStatsComponent(props: FirewallLogStatsProps) {
  const platform = usePlatform();

  switch (platform) {
    case 'mobile':
      return <FirewallLogStatsMobile {...props} />;
    case 'tablet':
      return <FirewallLogStatsTablet {...props} />;
    case 'desktop':
    default:
      return <FirewallLogStatsDesktop {...props} />;
  }
}

// Wrap with memo for performance optimization
export const FirewallLogStats = memo(FirewallLogStatsComponent);

// Set display name for React DevTools
FirewallLogStats.displayName = 'FirewallLogStats';
