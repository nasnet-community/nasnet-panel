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
      <div className={cn('flex items-center gap-4 text-xs font-mono min-h-[44px] content-center', className)}>
        <span className="flex items-center gap-1.5 text-success">
          <ArrowDown className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
          <span className="font-mono">{formatBytes(stats.rxBytes)}</span>
        </span>
        <span className="flex items-center gap-1.5 text-secondary">
          <ArrowUp className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
          <span className="font-mono">{formatBytes(stats.txBytes)}</span>
        </span>
        {hasIssues && (
          <AlertTriangle className="w-3 h-3 text-warning flex-shrink-0" aria-hidden="true" />
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Traffic Bars */}
      <div className="space-y-4">
        {/* Download */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ArrowDown className="w-4 h-4 text-success flex-shrink-0" aria-hidden="true" />
              <span className="text-foreground">{t('traffic.download')}</span>
            </div>
            <span className="text-sm font-mono font-medium text-foreground">
              {formatBytes(stats.rxBytes)}
            </span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden shadow-sm">
            <div className="h-full bg-gradient-to-r from-success/70 to-success rounded-full w-full" />
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span className="font-mono">{t('traffic.packets', { count: stats.rxPackets })}</span>
            {stats.rxErrors > 0 && (
              <span className="text-error font-mono font-medium">{t('traffic.errors', { count: stats.rxErrors })}</span>
            )}
          </div>
        </div>

        {/* Upload */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ArrowUp className="w-4 h-4 text-secondary flex-shrink-0" aria-hidden="true" />
              <span className="text-foreground">{t('traffic.upload')}</span>
            </div>
            <span className="text-sm font-mono font-medium text-foreground">
              {formatBytes(stats.txBytes)}
            </span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden shadow-sm">
            <div className="h-full bg-gradient-to-r from-secondary/70 to-secondary rounded-full w-full" />
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span className="font-mono">{t('traffic.packets', { count: stats.txPackets })}</span>
            {stats.txErrors > 0 && (
              <span className="text-error font-mono font-medium">{t('traffic.errors', { count: stats.txErrors })}</span>
            )}
          </div>
        </div>
      </div>

      {/* Issues Alert */}
      {hasIssues && (
        <div className="flex items-start gap-3 p-3 bg-warning/15 border border-warning/30 rounded-card-sm shadow-sm" role="alert" aria-live="assertive">
          <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-xs">
            <p className="font-medium text-warning">
              {t('traffic.hasIssues')}
            </p>
            <p className="text-warning/90 mt-1 font-mono">
              {hasErrors && t('traffic.errorsSummary', { count: stats.rxErrors + stats.txErrors })}
              {hasErrors && hasDrops && ', '}
              {hasDrops && t('traffic.droppedPackets', { count: stats.rxDrops + stats.txDrops })}
            </p>
          </div>
        </div>
      )}

      {/* Detailed Stats Grid */}
      {variant === 'detailed' && (
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
          <div className="bg-muted rounded-card-sm p-3.5 shadow-sm">
            <p className="text-xs text-muted-foreground mb-2 font-medium">{t('traffic.rxPackets')}</p>
            <p className="text-sm font-mono font-medium text-foreground">
              {formatNumber(stats.rxPackets)}
            </p>
          </div>
          <div className="bg-muted rounded-card-sm p-3.5 shadow-sm">
            <p className="text-xs text-muted-foreground mb-2 font-medium">{t('traffic.txPackets')}</p>
            <p className="text-sm font-mono font-medium text-foreground">
              {formatNumber(stats.txPackets)}
            </p>
          </div>
          <div className="bg-muted rounded-card-sm p-3.5 shadow-sm">
            <p className="text-xs text-muted-foreground mb-2 font-medium">{t('traffic.rxDrops')}</p>
            <p className={cn(
              'text-sm font-mono font-medium',
              stats.rxDrops > 0 ? 'text-error' : 'text-foreground'
            )}>
              {formatNumber(stats.rxDrops)}
            </p>
          </div>
          <div className="bg-muted rounded-card-sm p-3.5 shadow-sm">
            <p className="text-xs text-muted-foreground mb-2 font-medium">{t('traffic.txDrops')}</p>
            <p className={cn(
              'text-sm font-mono font-medium',
              stats.txDrops > 0 ? 'text-error' : 'text-foreground'
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
