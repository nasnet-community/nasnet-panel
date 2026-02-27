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
    loading: { label: t('status.connecting'), dotClass: 'bg-muted-foreground', textClass: 'text-muted-foreground' },
  };

  const status = statusConfig[networkStatus];

  if (isLoading) {
    return (
      <div className="flex justify-between items-center px-4 py-3 border-b border-border animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-muted rounded-lg" />
          <div className="space-y-1">
            <div className="h-4 bg-muted rounded w-24" />
            <div className="h-3 bg-muted rounded w-16" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-between items-center px-4 py-3 border-b border-border">
      <div className="flex items-center gap-3">
        {/* Router Logo/Icon */}
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-sm font-bold text-foreground">
          N
        </div>

        {/* Router Identity */}
        <div>
          <p className="text-foreground text-sm font-medium font-display">
            {routerInfo?.identity || 'Router'}
          </p>
          <div className="flex items-center gap-1.5">
            <span className={cn('w-1.5 h-1.5 rounded-full', status.dotClass)} />
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
        className="p-2 min-h-[44px] w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={t('actions.menu')}
        type="button"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
    </div>
  );
});

NetworkTopBar.displayName = 'NetworkTopBar';


























