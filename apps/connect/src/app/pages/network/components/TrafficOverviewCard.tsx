/**
 * Traffic Overview Card Component
 * Dashboard Pro style - Dark theme with traffic visualization
 */

import React, { useMemo } from 'react';

import { Activity, ArrowDown, ArrowUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { type NetworkInterface } from '@nasnet/core/types';

interface TrafficOverviewCardProps {
  interfaces: NetworkInterface[];
  isLoading?: boolean;
}

export const TrafficOverviewCard = React.memo(function TrafficOverviewCard({
  interfaces,
  isLoading,
}: TrafficOverviewCardProps) {
  const { t } = useTranslation('network');
  const stats = useMemo(() => {
    const active = interfaces.filter((i) => i.status === 'running' && i.linkStatus === 'up');
    return { activeCount: active.length };
  }, [interfaces]);

  if (isLoading) {
    return (
      <div
        className="bg-card rounded-card-sm animate-pulse p-4"
        role="status"
        aria-label="Loading traffic overview"
      >
        <div className="mb-4 flex items-center gap-2">
          <div className="bg-muted h-6 w-6 rounded" />
          <div className="bg-muted h-4 w-24 rounded" />
        </div>
        <div className="bg-muted rounded-card-sm mb-3 h-20" />
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted rounded-card-sm h-12" />
          <div className="bg-muted rounded-card-sm h-12" />
        </div>
        <span className="sr-only">Loading traffic overview...</span>
      </div>
    );
  }

  // Sample traffic data for visualization
  const trafficBars = [40, 60, 45, 80, 55, 70, 90, 65, 75, 50, 85, 60];

  return (
    <div className="bg-card rounded-card-sm border-border border p-4 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity
            className="text-primary h-4 w-4"
            aria-hidden="true"
          />
          <span className="text-muted-foreground font-display text-xs uppercase tracking-wide">
            {t('traffic.title')}
          </span>
        </div>
        <span
          className="text-muted-foreground text-xs"
          role="status"
        >
          {t('status.live', { ns: 'common' })}
        </span>
      </div>

      {/* Traffic Graph */}
      <div
        className="rounded-card-sm focus-visible:ring-ring mb-4 flex h-20 items-end gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        role="img"
        aria-label="Traffic bar chart for the last hour"
        tabIndex={-1}
      >
        {trafficBars.map((height, i) => (
          <div
            key={i}
            className="from-info/40 to-info/10 hover:from-info/60 hover:to-info/20 flex-1 rounded-t bg-gradient-to-t transition-all duration-300"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
      <div className="text-muted-foreground mb-4 flex justify-between text-xs">
        <span>-1h</span>
        <span>now</span>
      </div>

      {/* Download/Upload Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted rounded-card-sm border-border/50 border p-3">
          <div className="mb-1 flex items-center gap-2">
            <ArrowDown
              className="text-info h-3.5 w-3.5"
              aria-hidden="true"
            />
            <span className="text-muted-foreground text-xs">{t('traffic.download')}</span>
          </div>
          <p className="text-foreground font-mono font-semibold">--</p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {t('traffic.activeInterfaces', { count: stats.activeCount })}
          </p>
        </div>

        <div className="bg-muted rounded-card-sm border-border/50 border p-3">
          <div className="mb-1 flex items-center gap-2">
            <ArrowUp
              className="text-secondary h-3.5 w-3.5"
              aria-hidden="true"
            />
            <span className="text-muted-foreground text-xs">{t('traffic.upload')}</span>
          </div>
          <p className="text-foreground font-mono font-semibold">--</p>
          <p className="text-muted-foreground mt-0.5 text-xs">{t('traffic.realtimeUnavailable')}</p>
        </div>
      </div>
    </div>
  );
});

TrafficOverviewCard.displayName = 'TrafficOverviewCard';
