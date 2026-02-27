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
      <div
        className={cn(
          'flex min-h-[44px] content-center items-center gap-4 font-mono text-xs',
          className
        )}
      >
        <span className="text-success flex items-center gap-1.5">
          <ArrowDown
            className="h-3 w-3 flex-shrink-0"
            aria-hidden="true"
          />
          <span className="font-mono">{formatBytes(stats.rxBytes)}</span>
        </span>
        <span className="text-secondary flex items-center gap-1.5">
          <ArrowUp
            className="h-3 w-3 flex-shrink-0"
            aria-hidden="true"
          />
          <span className="font-mono">{formatBytes(stats.txBytes)}</span>
        </span>
        {hasIssues && (
          <AlertTriangle
            className="text-warning h-3 w-3 flex-shrink-0"
            aria-hidden="true"
          />
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
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ArrowDown
                className="text-success h-4 w-4 flex-shrink-0"
                aria-hidden="true"
              />
              <span className="text-foreground">{t('traffic.download')}</span>
            </div>
            <span className="text-foreground font-mono text-sm font-medium">
              {formatBytes(stats.rxBytes)}
            </span>
          </div>
          <div className="bg-muted h-2.5 overflow-hidden rounded-full shadow-sm">
            <div className="from-success/70 to-success h-full w-full rounded-full bg-gradient-to-r" />
          </div>
          <div className="text-muted-foreground mt-2 flex justify-between text-xs">
            <span className="font-mono">{t('traffic.packets', { count: stats.rxPackets })}</span>
            {stats.rxErrors > 0 && (
              <span className="text-error font-mono font-medium">
                {t('traffic.errors', { count: stats.rxErrors })}
              </span>
            )}
          </div>
        </div>

        {/* Upload */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ArrowUp
                className="text-secondary h-4 w-4 flex-shrink-0"
                aria-hidden="true"
              />
              <span className="text-foreground">{t('traffic.upload')}</span>
            </div>
            <span className="text-foreground font-mono text-sm font-medium">
              {formatBytes(stats.txBytes)}
            </span>
          </div>
          <div className="bg-muted h-2.5 overflow-hidden rounded-full shadow-sm">
            <div className="from-secondary/70 to-secondary h-full w-full rounded-full bg-gradient-to-r" />
          </div>
          <div className="text-muted-foreground mt-2 flex justify-between text-xs">
            <span className="font-mono">{t('traffic.packets', { count: stats.txPackets })}</span>
            {stats.txErrors > 0 && (
              <span className="text-error font-mono font-medium">
                {t('traffic.errors', { count: stats.txErrors })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Issues Alert */}
      {hasIssues && (
        <div
          className="bg-warning/15 border-warning/30 rounded-card-sm flex items-start gap-3 border p-3 shadow-sm"
          role="alert"
          aria-live="assertive"
        >
          <AlertTriangle
            className="text-warning mt-0.5 h-4 w-4 flex-shrink-0"
            aria-hidden="true"
          />
          <div className="text-xs">
            <p className="text-warning font-medium">{t('traffic.hasIssues')}</p>
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
        <div className="border-border grid grid-cols-2 gap-3 border-t pt-4">
          <div className="bg-muted rounded-card-sm p-3.5 shadow-sm">
            <p className="text-muted-foreground mb-2 text-xs font-medium">
              {t('traffic.rxPackets')}
            </p>
            <p className="text-foreground font-mono text-sm font-medium">
              {formatNumber(stats.rxPackets)}
            </p>
          </div>
          <div className="bg-muted rounded-card-sm p-3.5 shadow-sm">
            <p className="text-muted-foreground mb-2 text-xs font-medium">
              {t('traffic.txPackets')}
            </p>
            <p className="text-foreground font-mono text-sm font-medium">
              {formatNumber(stats.txPackets)}
            </p>
          </div>
          <div className="bg-muted rounded-card-sm p-3.5 shadow-sm">
            <p className="text-muted-foreground mb-2 text-xs font-medium">{t('traffic.rxDrops')}</p>
            <p
              className={cn(
                'font-mono text-sm font-medium',
                stats.rxDrops > 0 ? 'text-error' : 'text-foreground'
              )}
            >
              {formatNumber(stats.rxDrops)}
            </p>
          </div>
          <div className="bg-muted rounded-card-sm p-3.5 shadow-sm">
            <p className="text-muted-foreground mb-2 text-xs font-medium">{t('traffic.txDrops')}</p>
            <p
              className={cn(
                'font-mono text-sm font-medium',
                stats.txDrops > 0 ? 'text-error' : 'text-foreground'
              )}
            >
              {formatNumber(stats.txDrops)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

TrafficStats.displayName = 'TrafficStats';
