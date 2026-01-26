/**
 * Log Stats Component
 * Displays statistics and severity distribution for logs
 * Epic 0.8: System Logs - Statistics Summary
 */

import * as React from 'react';
import { cn, Button } from '@nasnet/ui/primitives';
import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import type { LogEntry, LogSeverity } from '@nasnet/core/types';

export interface LogStatsProps {
  /**
   * Log entries to compute stats from
   */
  logs: LogEntry[];
  /**
   * Last update timestamp
   */
  lastUpdated?: Date;
  /**
   * Whether data is currently loading
   */
  isLoading?: boolean;
  /**
   * Additional class names
   */
  className?: string;
}

interface SeverityStats {
  severity: LogSeverity;
  count: number;
  percentage: number;
  color: string;
}

const severityColors: Record<LogSeverity, string> = {
  debug: 'bg-slate-400',
  info: 'bg-info',
  warning: 'bg-warning',
  error: 'bg-error',
  critical: 'bg-error',
};

const severityOrder: LogSeverity[] = ['critical', 'error', 'warning', 'info', 'debug'];

/**
 * Compute stats from logs
 */
function computeStats(logs: LogEntry[]): SeverityStats[] {
  const counts = new Map<LogSeverity, number>();

  for (const log of logs) {
    const current = counts.get(log.severity) || 0;
    counts.set(log.severity, current + 1);
  }

  const total = logs.length || 1;

  return severityOrder.map((severity) => ({
    severity,
    count: counts.get(severity) || 0,
    percentage: ((counts.get(severity) || 0) / total) * 100,
    color: severityColors[severity],
  }));
}

/**
 * Format relative time
 */
function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

/**
 * LogStats Component
 */
export function LogStats({
  logs,
  lastUpdated,
  isLoading,
  className,
}: LogStatsProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
  const stats = React.useMemo(() => computeStats(logs), [logs]);

  // Update relative time every 10 seconds
  React.useEffect(() => {
    const interval = setInterval(forceUpdate, 10000);
    return () => clearInterval(interval);
  }, []);

  const nonZeroStats = stats.filter((s) => s.count > 0);

  return (
    <div
      className={cn(
        'rounded-card-sm border bg-card p-3 transition-all',
        className
      )}
    >
      {/* Header - Always visible */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Total count */}
          <div className="flex items-center gap-2">
            <span className="text-2xl font-semibold tabular-nums">
              {logs.length}
            </span>
            <span className="text-sm text-muted-foreground">entries</span>
          </div>

          {/* Severity badges - compact */}
          <div className="hidden sm:flex items-center gap-2">
            {nonZeroStats.map((stat) => (
              <div
                key={stat.severity}
                className={cn(
                  'flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
                  stat.severity === 'critical' || stat.severity === 'error'
                    ? 'bg-error/10 text-error'
                    : stat.severity === 'warning'
                      ? 'bg-warning/10 text-warning'
                      : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground'
                )}
              >
                <span className={cn('w-2 h-2 rounded-full', stat.color)} />
                <span className="capitalize">{stat.severity}</span>
                <span className="tabular-nums">{stat.count}</span>
              </div>
            ))}
          </div>

          {/* Last updated */}
          {lastUpdated && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <RefreshCw
                className={cn('h-3 w-3', isLoading && 'animate-spin')}
              />
              <span>Updated {formatRelativeTime(lastUpdated)}</span>
            </div>
          )}
        </div>

        {/* Expand/collapse button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="shrink-0"
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Expanded content - Severity distribution bar */}
      {isExpanded && logs.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          {/* Bar chart */}
          <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
            {stats.map(
              (stat) =>
                stat.percentage > 0 && (
                  <div
                    key={stat.severity}
                    className={cn(
                      'h-full transition-all',
                      stat.color,
                      stat.severity === 'critical' && 'animate-pulse'
                    )}
                    style={{ width: `${stat.percentage}%` }}
                    title={`${stat.severity}: ${stat.count} (${stat.percentage.toFixed(1)}%)`}
                  />
                )
            )}
          </div>

          {/* Legend - mobile */}
          <div className="flex sm:hidden flex-wrap gap-2 mt-2">
            {nonZeroStats.map((stat) => (
              <div
                key={stat.severity}
                className="flex items-center gap-1 text-xs text-muted-foreground"
              >
                <span className={cn('w-2 h-2 rounded-full', stat.color)} />
                <span className="capitalize">{stat.severity}:</span>
                <span className="tabular-nums">{stat.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

























