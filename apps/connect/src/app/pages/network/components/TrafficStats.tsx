/**
 * Traffic Statistics Component
 * Dashboard Pro style with visual bars and compact layout
 */

import { ArrowUp, ArrowDown, AlertTriangle } from 'lucide-react';

import { type TrafficStatistics } from '@nasnet/core/types';
import { formatBytes, formatNumber } from '@nasnet/core/utils';

import { cn } from '@/lib/utils';

interface TrafficStatsProps {
  stats: TrafficStatistics;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

export function TrafficStats({
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
              <span className="text-slate-600 dark:text-slate-300">Download</span>
            </div>
            <span className="text-sm font-mono text-slate-900 dark:text-white">
              {formatBytes(stats.rxBytes)}
            </span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full w-full" />
          </div>
          <div className="flex justify-between mt-1 text-xs text-slate-500 dark:text-slate-400">
            <span>{formatNumber(stats.rxPackets)} packets</span>
            {stats.rxErrors > 0 && (
              <span className="text-red-500">{stats.rxErrors} errors</span>
            )}
          </div>
        </div>

        {/* Upload */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 text-sm">
              <ArrowUp className="w-4 h-4 text-purple-500" />
              <span className="text-slate-600 dark:text-slate-300">Upload</span>
            </div>
            <span className="text-sm font-mono text-slate-900 dark:text-white">
              {formatBytes(stats.txBytes)}
            </span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-400 to-purple-500 rounded-full w-full" />
          </div>
          <div className="flex justify-between mt-1 text-xs text-slate-500 dark:text-slate-400">
            <span>{formatNumber(stats.txPackets)} packets</span>
            {stats.txErrors > 0 && (
              <span className="text-red-500">{stats.txErrors} errors</span>
            )}
          </div>
        </div>
      </div>

      {/* Issues Alert */}
      {hasIssues && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
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
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">RX Packets</p>
            <p className="text-sm font-mono text-slate-900 dark:text-white">
              {formatNumber(stats.rxPackets)}
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">TX Packets</p>
            <p className="text-sm font-mono text-slate-900 dark:text-white">
              {formatNumber(stats.txPackets)}
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">RX Drops</p>
            <p className={cn(
              'text-sm font-mono',
              stats.rxDrops > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'
            )}>
              {formatNumber(stats.rxDrops)}
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">TX Drops</p>
            <p className={cn(
              'text-sm font-mono',
              stats.txDrops > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'
            )}>
              {formatNumber(stats.txDrops)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
