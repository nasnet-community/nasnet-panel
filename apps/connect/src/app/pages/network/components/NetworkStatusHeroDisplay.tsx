/**
 * Network Status Hero Display Component
 * Minimal display-only presenter for overall network status.
 * Shows connection status badge, router identity, and a summary uptime string.
 */

import React from 'react';

import { useTranslation } from 'react-i18next';

import { cn } from '@nasnet/ui/utils';

type NetworkDisplayStatus = 'online' | 'degraded' | 'offline' | 'connecting';

interface NetworkStatusHeroDisplayProps {
  /** Router identity / hostname */
  routerName?: string;
  /** Current network status */
  status: NetworkDisplayStatus;
  /** Human-readable uptime string, e.g. "3d 4h 25m" */
  uptime?: string;
  /** RouterOS version string, e.g. "7.14.2" */
  version?: string;
  /** Number of active interfaces */
  activeInterfaces?: number;
  /** Total number of interfaces */
  totalInterfaces?: number;
}

// Note: STATUS_CONFIG labels are localized dynamically in the component
const STATUS_CONFIG: Record<NetworkDisplayStatus, { dotClass: string; badgeClass: string }> = {
  online: {
    dotClass: 'bg-success animate-pulse',
    badgeClass: 'bg-success/10 text-success border-success/20',
  },
  degraded: {
    dotClass: 'bg-warning',
    badgeClass: 'bg-warning/10 text-warning border-warning/20',
  },
  offline: {
    dotClass: 'bg-error',
    badgeClass: 'bg-error/10 text-error border-error/20',
  },
  connecting: {
    dotClass: 'bg-muted-foreground animate-pulse',
    badgeClass: 'bg-muted/50 text-muted-foreground border-border',
  },
};

export const NetworkStatusHeroDisplay = React.memo(function NetworkStatusHeroDisplay({
  routerName = 'Router',
  status,
  uptime,
  version,
  activeInterfaces,
  totalInterfaces,
}: NetworkStatusHeroDisplayProps) {
  const { t } = useTranslation('network');
  const statusLabelMap: Record<NetworkDisplayStatus, string> = {
    online: t('status.online'),
    degraded: t('status.degraded'),
    offline: t('status.offline'),
    connecting: t('status.connecting'),
  };
  const cfg = STATUS_CONFIG[status];

  return (
    <div className="bg-card border-border category-hero-networking flex flex-col gap-3 rounded-2xl border p-4 shadow-md">
      {/* Identity row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary text-background flex h-10 w-10 select-none items-center justify-center rounded-xl text-sm font-bold">
            N
          </div>
          <div>
            <p className="text-foreground font-display text-sm font-semibold leading-tight">
              {routerName}
            </p>
            {version && (
              <p className="text-muted-foreground text-xs">
                {t('status.routerOS')} {version}
              </p>
            )}
          </div>
        </div>

        {/* Status badge */}
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium',
            cfg.badgeClass
          )}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dotClass)} />
          {statusLabelMap[status]}
        </span>
      </div>

      {/* Stats row */}
      <div className="border-border flex items-center gap-4 border-t pt-1">
        {uptime && (
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">
              {t('quickStats.uptime')}
            </p>
            <p className="text-foreground font-mono text-sm font-medium">{uptime}</p>
          </div>
        )}
        {activeInterfaces !== undefined && totalInterfaces !== undefined && (
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">
              {t('quickStats.interfaces')}
            </p>
            <p className="text-foreground font-mono text-sm font-medium">
              {activeInterfaces}
              <span className="text-muted-foreground">/{totalInterfaces}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

NetworkStatusHeroDisplay.displayName = 'NetworkStatusHeroDisplay';
