/**
 * Traffic Statistics Component
 * Dashboard Pro style with visual bars and compact layout
 */

import { memo } from 'react';

import { ArrowUp, ArrowDown, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';


import { type TrafficStatistics } from '@nasnet/core/types';
import { formatBytes, formatNumber } from '@nasnet/core/utils';

import { cn } from '@nasnet/ui/utils';

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
  const { t } = useTranslation('network');
  const hasErrors = stats.txErrors > 0 || stats.rxErrors > 0;
  const hasDrops = stats.txDrops > 0 || stats.rxDrops > 0;
  const hasIssues = hasErrors || hasDrops;

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-4 text-xs font-mono', className)}>
        <span className="flex items-center gap-1.5 text-success">
          <ArrowDown className="w-3 h-3" />
          {formatBytes(stats.rxBytes)}
        </span>
        <span className="flex items-center gap-1.5 text-category-monitoring">
          <ArrowUp className="w-3 h-3" />
          {formatBytes(stats.txBytes)}
        </span>
        {hasIssues && (
          <AlertTriangle className="w-3 h-3 text-warning" />
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
              <ArrowDown className="w-4 h-4 text-success" />
              <span className="text-foreground">{t('traffic.download')}</span>
            </div>
            <span className="text-sm font-mono text-foreground">
              {formatBytes(stats.rxBytes)}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-success/70 to-success rounded-full w-full" />
          </div>
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span>{t('traffic.packets', { count: stats.rxPackets })}</span>
            {stats.rxErrors > 0 && (
              <span className="text-destructive">{t('traffic.errors', { count: stats.rxErrors })}</span>
            )}
          </div>
        </div>

        {/* Upload */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 text-sm">
              <ArrowUp className="w-4 h-4 text-category-monitoring" />
              <span className="text-foreground">{t('traffic.upload')}</span>
            </div>
            <span className="text-sm font-mono text-foreground">
              {formatBytes(stats.txBytes)}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-category-monitoring/70 to-category-monitoring rounded-full w-full" />
          </div>
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span>{t('traffic.packets', { count: stats.txPackets })}</span>
            {stats.txErrors > 0 && (
              <span className="text-destructive">{t('traffic.errors', { count: stats.txErrors })}</span>
            )}
          </div>
        </div>
      </div>

      {/* Issues Alert */}
      {hasIssues && (
        <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/30 rounded-lg" role="alert">
          <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-xs">
            <p className="font-medium text-warning">
              {t('traffic.hasIssues')}
            </p>
            <p className="text-warning/80 mt-0.5">
              {hasErrors && t('traffic.errorsSummary', { count: stats.rxErrors + stats.txErrors })}
              {hasErrors && hasDrops && ', '}
              {hasDrops && t('traffic.droppedPackets', { count: stats.rxDrops + stats.txDrops })}
            </p>
          </div>
        </div>
      )}

      {/* Detailed Stats Grid */}
      {variant === 'detailed' && (
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">{t('traffic.rxPackets')}</p>
            <p className="text-sm font-mono text-foreground">
              {formatNumber(stats.rxPackets)}
            </p>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">{t('traffic.txPackets')}</p>
            <p className="text-sm font-mono text-foreground">
              {formatNumber(stats.txPackets)}
            </p>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">{t('traffic.rxDrops')}</p>
            <p className={cn(
              'text-sm font-mono',
              stats.rxDrops > 0 ? 'text-destructive' : 'text-foreground'
            )}>
              {formatNumber(stats.rxDrops)}
            </p>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">{t('traffic.txDrops')}</p>
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
