/**
 * Network Status Hero Component
 * Dashboard Pro style stats grid showing overall network health
 */

import { memo } from 'react';

import { Activity, ArrowDown, ArrowUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { type NetworkInterface } from '@nasnet/core/types';
import { formatBytes } from '@nasnet/core/utils';

interface NetworkStatusHeroProps {
  interfaces: NetworkInterface[];
  totalTraffic?: {
    txBytes: number;
    rxBytes: number;
    txRate?: number;
    rxRate?: number;
  };
  isLoading?: boolean;
}

export const NetworkStatusHero = memo(function NetworkStatusHero({
  interfaces,
  totalTraffic,
  isLoading,
}: NetworkStatusHeroProps) {
  const { t } = useTranslation('network');
  const activeInterfaces = interfaces.filter((i) => i.status === 'running');

  const activePercent = interfaces.length > 0
    ? Math.round((activeInterfaces.length / interfaces.length) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2 md:gap-3 animate-pulse" role="status" aria-label={t('status.loading')}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-muted rounded-xl p-3 md:p-4"
          >
            <div className="h-4 bg-muted-foreground/20 rounded w-12 mb-2" />
            <div className="h-6 bg-muted-foreground/20 rounded w-8 mb-1" />
            <div className="h-1.5 bg-muted-foreground/20 rounded-full mt-2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 md:gap-3">
      <div className="bg-card rounded-xl p-3 md:p-4 border border-border">
        <div className="flex items-center gap-1.5 mb-1">
          <Activity className="w-3.5 h-3.5 text-info" aria-hidden="true" />
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            {t('status.active')}
          </p>
        </div>
        <p className="text-xl md:text-2xl font-bold text-foreground">
          {activeInterfaces.length}
          <span className="text-muted-foreground text-sm font-normal ml-1">
            /{interfaces.length}
          </span>
        </p>
        <div className="w-full bg-muted rounded-full h-1.5 mt-2" role="progressbar" aria-valuenow={activePercent} aria-valuemin={0} aria-valuemax={100} aria-label="Active interfaces">
          <div
            className="bg-info h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${activePercent}%` }}
          />
        </div>
      </div>

      <div className="bg-card rounded-xl p-3 md:p-4 border border-border">
        <div className="flex items-center gap-1.5 mb-1">
          <ArrowDown className="w-3.5 h-3.5 text-success" aria-hidden="true" />
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            {t('traffic.download')}
          </p>
        </div>
        <p className="text-xl md:text-2xl font-bold text-foreground font-mono">
          {totalTraffic ? formatBytes(totalTraffic.rxBytes) : '0 B'}
        </p>
        {totalTraffic?.rxRate !== undefined && (
          <p className="text-xs text-success mt-1">
            {formatBytes(totalTraffic.rxRate)}/s
          </p>
        )}
      </div>

      <div className="bg-card rounded-xl p-3 md:p-4 border border-border">
        <div className="flex items-center gap-1.5 mb-1">
          <ArrowUp className="w-3.5 h-3.5 text-warning" aria-hidden="true" />
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            {t('traffic.upload')}
          </p>
        </div>
        <p className="text-xl md:text-2xl font-bold text-foreground font-mono">
          {totalTraffic ? formatBytes(totalTraffic.txBytes) : '0 B'}
        </p>
        {totalTraffic?.txRate !== undefined && (
          <p className="text-xs text-warning mt-1">
            {formatBytes(totalTraffic.txRate)}/s
          </p>
        )}
      </div>
    </div>
  );
});

NetworkStatusHero.displayName = 'NetworkStatusHero';























