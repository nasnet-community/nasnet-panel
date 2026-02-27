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

  const activePercent =
    interfaces.length > 0 ? Math.round((activeInterfaces.length / interfaces.length) * 100) : 0;

  if (isLoading) {
    return (
      <div
        className="grid animate-pulse grid-cols-3 gap-2 md:gap-3"
        role="status"
        aria-label={t('status.loading')}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-muted rounded-xl p-3 md:p-4"
          >
            <div className="bg-muted-foreground/20 mb-2 h-4 w-12 rounded" />
            <div className="bg-muted-foreground/20 mb-1 h-6 w-8 rounded" />
            <div className="bg-muted-foreground/20 mt-2 h-1.5 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 md:gap-3">
      <div className="bg-card border-border rounded-xl border p-3 shadow-md md:p-4">
        <div className="mb-1 flex items-center gap-1.5">
          <Activity
            className="text-info h-3.5 w-3.5"
            aria-hidden="true"
          />
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            {t('status.active')}
          </p>
        </div>
        <p className="text-foreground text-xl font-bold md:text-2xl">
          {activeInterfaces.length}
          <span className="text-muted-foreground ml-1 text-sm font-normal">
            /{interfaces.length}
          </span>
        </p>
        <div
          className="bg-muted mt-2 h-1.5 w-full rounded-full"
          role="progressbar"
          aria-valuenow={activePercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Active interfaces"
        >
          <div
            className="bg-info h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${activePercent}%` }}
          />
        </div>
      </div>

      <div className="bg-card border-border rounded-xl border p-3 shadow-md md:p-4">
        <div className="mb-1 flex items-center gap-1.5">
          <ArrowDown
            className="text-success h-3.5 w-3.5"
            aria-hidden="true"
          />
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            {t('traffic.download')}
          </p>
        </div>
        <p className="text-foreground font-mono text-xl font-bold md:text-2xl">
          {totalTraffic ? formatBytes(totalTraffic.rxBytes) : '0 B'}
        </p>
        {totalTraffic?.rxRate !== undefined && (
          <p className="text-success mt-1 text-xs">{formatBytes(totalTraffic.rxRate)}/s</p>
        )}
      </div>

      <div className="bg-card border-border rounded-xl border p-3 shadow-md md:p-4">
        <div className="mb-1 flex items-center gap-1.5">
          <ArrowUp
            className="text-warning h-3.5 w-3.5"
            aria-hidden="true"
          />
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            {t('traffic.upload')}
          </p>
        </div>
        <p className="text-foreground font-mono text-xl font-bold md:text-2xl">
          {totalTraffic ? formatBytes(totalTraffic.txBytes) : '0 B'}
        </p>
        {totalTraffic?.txRate !== undefined && (
          <p className="text-warning mt-1 text-xs">{formatBytes(totalTraffic.txRate)}/s</p>
        )}
      </div>
    </div>
  );
});

NetworkStatusHero.displayName = 'NetworkStatusHero';
