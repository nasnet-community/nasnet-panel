/**
 * Interface Compact List Component
 * Dashboard Pro style - Compact list view for interfaces
 */

import React from 'react';

import { ChevronRight, ArrowDown, ArrowUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';


import { useInterfaceTraffic } from '@nasnet/api-client/queries';
import { type NetworkInterface } from '@nasnet/core/types';
import { formatBytes } from '@nasnet/core/utils';
import { useConnectionStore } from '@nasnet/state/stores';

import { cn } from '@nasnet/ui/utils';

import { InterfaceTypeIcon } from './InterfaceTypeIcon';

interface InterfaceCompactListProps {
  interfaces: NetworkInterface[];
  isLoading?: boolean;
  maxItems?: number;
}

const InterfaceListItem = React.memo(function InterfaceListItem({ iface }: { iface: NetworkInterface }) {
  const { t } = useTranslation('network');
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';
  const { data: trafficStats } = useInterfaceTraffic(routerIp, iface.id);

  const isRunning = iface.status === 'running';
  const isLinkUp = iface.linkStatus === 'up';

  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'w-2 h-2 rounded-full',
            isRunning && isLinkUp ? 'bg-success' : isRunning ? 'bg-warning' : 'bg-muted-foreground'
          )}
        />
        <InterfaceTypeIcon type={iface.type} className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-foreground text-sm">{iface.name}</span>
      </div>
      <div className="flex items-center gap-3">
        {trafficStats && isRunning && isLinkUp ? (
          <span className="text-muted-foreground text-xs font-mono flex items-center gap-2">
            <span className="flex items-center gap-0.5">
              <ArrowDown className="w-3 h-3 text-info" />
              {formatBytes(trafficStats.rxBytes)}
            </span>
            <span className="flex items-center gap-0.5">
              <ArrowUp className="w-3 h-3 text-secondary" />
              {formatBytes(trafficStats.txBytes)}
            </span>
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">
            {isRunning && isLinkUp ? t('status.active', { ns: 'common' }) : isRunning ? t('interfaces.noLink') : t('status.disabled', { ns: 'common' })}
          </span>
        )}
      </div>
    </div>
  );
});

InterfaceListItem.displayName = 'InterfaceListItem';

export const InterfaceCompactList = React.memo(function InterfaceCompactList({
  interfaces,
  isLoading,
  maxItems = 5,
}: InterfaceCompactListProps) {
  const { t } = useTranslation('network');
  const displayedInterfaces = interfaces.slice(0, maxItems);
  const hasMore = interfaces.length > maxItems;

  if (isLoading) {
    return (
      <div className="px-4 py-2 space-y-3 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-muted rounded-full" />
              <div className="w-4 h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded w-20" />
            </div>
            <div className="h-3 bg-muted rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 py-2">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <p className="text-muted-foreground text-xs uppercase tracking-wide">{t('interfaces.title')}</p>
        {hasMore && (
          <button className="text-primary text-xs flex items-center gap-0.5 hover:text-primary/80 transition-colors">
            {t('button.viewAll', { ns: 'common' })}
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Interface List */}
      <div className="space-y-0">
        {displayedInterfaces.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4 text-center">{t('interfaces.notFound')}</p>
        ) : (
          displayedInterfaces.map((iface) => (
            <InterfaceListItem key={iface.id} iface={iface} />
          ))
        )}
      </div>
    </div>
  );
});

InterfaceCompactList.displayName = 'InterfaceCompactList';


























