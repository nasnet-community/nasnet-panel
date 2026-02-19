/**
 * Traffic Statistics Component
 * Dashboard Pro style with visual bars and compact layout
 */

import { memo } from 'react';

import { ArrowUp, ArrowDown, AlertTriangle } from 'lucide-react';

import { type TrafficStatistics } from '@nasnet/core/types';
import { formatBytes, formatNumber } from '@nasnet/core/utils';

import { cn } from '@/lib/utils';

interface TrafficStatsProps {
  stats: TrafficStatistics;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

export const TrafficStats = memo(function TrafficStats({
  stats,
  variant = 'default',
  className,
}: TrafficStatsProps) {
  const hasErrors = stats.txErrors > 0 || stats.rxErrors > 0;
  const hasDrops = stats.txDrops > 0 || stats.rxDrops > 0;
  const hasIssues = hasErrors || hasDrops;

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-4 text-xs font-mono', className)}>
        <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
          <ArrowDown className="w-3 h-3" />
          {formatBytes(stats.rxBytes)}
        </span>
        <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
          <ArrowUp className="w-3 h-3" />
          {formatBytes(stats.txBytes)}
        </span>
        {hasIssues && (
          <AlertTriangle className="w-3 h-3 text-amber-500" />
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Traffic Bars */}
      <div className="space-y-3">
        {/* Download */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 text-sm">
              <ArrowDown className="w-4 h-4 text-emerald-500" />
              <span className="text-foreground">Download</span>
            </div>
            <span className="text-sm font-mono text-foreground">
              {formatBytes(stats.rxBytes)}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full w-full" />
          </div>
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span>{formatNumber(stats.rxPackets)} packets</span>
            {stats.rxErrors > 0 && (
              <span className="text-destructive">{stats.rxErrors} errors</span>
            )}
          </div>
        </div>

        {/* Upload */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 text-sm">
              <ArrowUp className="w-4 h-4 text-purple-500" />
              <span className="text-foreground">Upload</span>
            </div>
            <span className="text-sm font-mono text-foreground">
              {formatBytes(stats.txBytes)}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-400 to-purple-500 rounded-full w-full" />
          </div>
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span>{formatNumber(stats.txPackets)} packets</span>
            {stats.txErrors > 0 && (
              <span className="text-destructive">{stats.txErrors} errors</span>
            )}
          </div>
        </div>
      </div>

      {/* Issues Alert */}
      {hasIssues && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg" role="alert">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-xs">
            <p className="font-medium text-amber-800 dark:text-amber-300">
              Interface has issues
            </p>
            <p className="text-amber-700 dark:text-amber-400 mt-0.5">
              {hasErrors && `${stats.rxErrors + stats.txErrors} errors`}
              {hasErrors && hasDrops && ', '}
              {hasDrops && `${stats.rxDrops + stats.txDrops} dropped packets`}
            </p>
          </div>
        </div>
      )}

      {/* Detailed Stats Grid */}
      {variant === 'detailed' && (
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">RX Packets</p>
            <p className="text-sm font-mono text-foreground">
              {formatNumber(stats.rxPackets)}
            </p>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">TX Packets</p>
            <p className="text-sm font-mono text-foreground">
              {formatNumber(stats.txPackets)}
            </p>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">RX Drops</p>
            <p className={cn(
              'text-sm font-mono',
              stats.rxDrops > 0 ? 'text-destructive' : 'text-foreground'
            )}>
              {formatNumber(stats.rxDrops)}
            </p>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">TX Drops</p>
            <p className={cn(
              'text-sm font-mono',
              stats.txDrops > 0 ? 'text-destructive' : 'text-foreground'
            )}>
              {formatNumber(stats.txDrops)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

TrafficStats.displayName = 'TrafficStats';
