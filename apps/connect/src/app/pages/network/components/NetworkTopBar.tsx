/**
 * Network Top Bar Component
 * Dashboard Pro style - Compact header with router identity and status
 */

import React from 'react';

import { MoreVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { type SystemInfo } from '@nasnet/core/types';

import { cn } from '@nasnet/ui/utils';

type NetworkStatus = 'healthy' | 'warning' | 'error' | 'loading';

interface NetworkTopBarProps {
  routerInfo?: SystemInfo;
  networkStatus: NetworkStatus;
  isLoading?: boolean;
}

export const NetworkTopBar = React.memo(function NetworkTopBar({
  routerInfo,
  networkStatus,
  isLoading,
}: NetworkTopBarProps) {
  const { t } = useTranslation('network');
  const statusConfig = {
    healthy: { label: t('status.online'), dotClass: 'bg-success', textClass: 'text-success' },
    warning: { label: t('status.degraded'), dotClass: 'bg-warning', textClass: 'text-warning' },
    error: { label: t('status.offline'), dotClass: 'bg-error', textClass: 'text-error' },
    loading: {
      label: t('status.connecting'),
      dotClass: 'bg-muted-foreground',
      textClass: 'text-muted-foreground',
    },
  };

  const status = statusConfig[networkStatus];

  if (isLoading) {
    return (
      <div className="border-border flex animate-pulse items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="bg-muted h-8 w-8 rounded-lg" />
          <div className="space-y-1">
            <div className="bg-muted h-4 w-24 rounded" />
            <div className="bg-muted h-3 w-16 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-border flex items-center justify-between border-b px-4 py-3">
      <div className="flex items-center gap-3">
        {/* Router Logo/Icon */}
        <div className="bg-primary text-foreground flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold">
          N
        </div>

        {/* Router Identity */}
        <div>
          <p className="text-foreground font-display text-sm font-medium">
            {routerInfo?.identity || 'Router'}
          </p>
          <div className="flex items-center gap-1.5">
            <span className={cn('h-1.5 w-1.5 rounded-full', status.dotClass)} />
            <span className={cn('text-xs', status.textClass)}>{status.label}</span>
            {routerInfo?.routerOsVersion && (
              <>
                <span className="text-muted-foreground text-xs">•</span>
                <span className="text-muted-foreground text-xs">v{routerInfo.routerOsVersion}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Menu Button */}
      <button
        className="text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring flex min-h-[44px] w-[44px] items-center justify-center rounded-lg p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        aria-label={t('actions.menu')}
        type="button"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
    </div>
  );
});

NetworkTopBar.displayName = 'NetworkTopBar';
