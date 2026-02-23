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
const STATUS_CONFIG: Record<
  NetworkDisplayStatus,
  { dotClass: string; badgeClass: string }
> = {
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
    <div className="flex flex-col gap-3 p-4 bg-card rounded-2xl border border-border">
      {/* Identity row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-background font-bold text-sm select-none">
            N
          </div>
          <div>
            <p className="text-foreground font-semibold text-sm leading-tight">{routerName}</p>
            {version && (
              <p className="text-muted-foreground text-xs">{t('status.routerOS')} {version}</p>
            )}
          </div>
        </div>

        {/* Status badge */}
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border',
            cfg.badgeClass,
          )}
        >
          <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dotClass)} />
          {statusLabelMap[status]}
        </span>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 pt-1 border-t border-border">
        {uptime && (
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">{t('quickStats.uptime')}</p>
            <p className="text-foreground text-sm font-mono font-medium">{uptime}</p>
          </div>
        )}
        {activeInterfaces !== undefined && totalInterfaces !== undefined && (
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">{t('quickStats.interfaces')}</p>
            <p className="text-foreground text-sm font-medium">
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
