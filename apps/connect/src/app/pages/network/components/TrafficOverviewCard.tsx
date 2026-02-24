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

export const TrafficOverviewCard = React.memo(function TrafficOverviewCard({ interfaces, isLoading }: TrafficOverviewCardProps) {
  const { t } = useTranslation('network');
  const stats = useMemo(() => {
    const active = interfaces.filter((i) => i.status === 'running' && i.linkStatus === 'up');
    return { activeCount: active.length };
  }, [interfaces]);

  if (isLoading) {
    return (
      <div className="bg-card rounded-card-sm p-4 animate-pulse" role="status" aria-label="Loading traffic overview">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 bg-muted rounded" />
          <div className="h-4 bg-muted rounded w-24" />
        </div>
        <div className="h-20 bg-muted rounded-card-sm mb-3" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-12 bg-muted rounded-card-sm" />
          <div className="h-12 bg-muted rounded-card-sm" />
        </div>
        <span className="sr-only">Loading traffic overview...</span>
      </div>
    );
  }

  // Sample traffic data for visualization
  const trafficBars = [40, 60, 45, 80, 55, 70, 90, 65, 75, 50, 85, 60];

  return (
    <div className="bg-card rounded-card-sm p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" aria-hidden="true" />
          <span className="text-muted-foreground text-xs uppercase tracking-wide">{t('traffic.title')}</span>
        </div>
        <span className="text-xs text-muted-foreground" role="status">{t('status.live', { ns: 'common' })}</span>
      </div>

      {/* Traffic Graph */}
      <div className="h-20 flex items-end gap-1 mb-4 rounded-card-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" role="img" aria-label="Traffic bar chart for the last hour" tabIndex={-1}>
        {trafficBars.map((height, i) => (
          <div
            key={i}
            className="flex-1 bg-gradient-to-t from-info/40 to-info/10 rounded-t transition-all duration-300 hover:from-info/60 hover:to-info/20"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between mb-4 text-xs text-muted-foreground">
        <span>-1h</span>
        <span>now</span>
      </div>

      {/* Download/Upload Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted rounded-card-sm p-3">
          <div className="flex items-center gap-2 mb-1">
            <ArrowDown className="w-3.5 h-3.5 text-info" aria-hidden="true" />
            <span className="text-muted-foreground text-xs">{t('traffic.download')}</span>
          </div>
          <p className="text-foreground font-mono font-semibold">--</p>
          <p className="text-muted-foreground text-xs mt-0.5">
            {t('traffic.activeInterfaces', { count: stats.activeCount })}
          </p>
        </div>

        <div className="bg-muted rounded-card-sm p-3">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUp className="w-3.5 h-3.5 text-secondary" aria-hidden="true" />
            <span className="text-muted-foreground text-xs">{t('traffic.upload')}</span>
          </div>
          <p className="text-foreground font-mono font-semibold">--</p>
          <p className="text-muted-foreground text-xs mt-0.5">{t('traffic.realtimeUnavailable')}</p>
        </div>
      </div>
    </div>
  );
});

TrafficOverviewCard.displayName = 'TrafficOverviewCard';
