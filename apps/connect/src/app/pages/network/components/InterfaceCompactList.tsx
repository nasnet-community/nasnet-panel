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

const InterfaceListItem = React.memo(function InterfaceListItem({
  iface,
}: {
  iface: NetworkInterface;
}) {
  const { t } = useTranslation('network');
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';
  const { data: trafficStats } = useInterfaceTraffic(routerIp, iface.id);

  const isRunning = iface.status === 'running';
  const isLinkUp = iface.linkStatus === 'up';

  return (
    <div className="py-component-sm border-border flex items-center justify-between border-b last:border-b-0">
      <div className="gap-component-sm flex items-center">
        <span
          className={cn(
            'h-2 w-2 rounded-full',
            isRunning && isLinkUp ? 'bg-success'
            : isRunning ? 'bg-warning'
            : 'bg-muted-foreground'
          )}
          aria-hidden="true"
        />
        <InterfaceTypeIcon
          type={iface.type}
          className="text-muted-foreground h-3.5 w-3.5"
        />
        <span className="font-display text-foreground text-sm font-semibold">{iface.name}</span>
      </div>
      <div className="gap-component-md flex items-center">
        {trafficStats && isRunning && isLinkUp ?
          <span className="text-muted-foreground gap-component-sm flex items-center font-mono text-xs">
            <span className="gap-component-xs flex items-center">
              <ArrowDown
                className="text-success h-3 w-3"
                aria-hidden="true"
              />
              {formatBytes(trafficStats.rxBytes)}
            </span>
            <span className="flex items-center gap-0.5">
              <ArrowUp
                className="text-category-monitoring h-3 w-3"
                aria-hidden="true"
              />
              {formatBytes(trafficStats.txBytes)}
            </span>
          </span>
        : <span
            className={cn(
              'text-xs',
              isRunning && isLinkUp ? 'text-success'
              : isRunning ? 'text-warning'
              : 'text-muted-foreground'
            )}
          >
            {isRunning && isLinkUp ?
              t('status.active', { ns: 'common' })
            : isRunning ?
              t('interfaces.noLink')
            : t('status.disabled', { ns: 'common' })}
          </span>
        }
        {/* View all button for accessibility */}
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
      <div className="px-component-lg py-component-sm space-y-component-md animate-pulse">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="py-component-sm flex items-center justify-between"
          >
            <div className="gap-component-sm flex items-center">
              <div className="bg-muted h-2 w-2 rounded-full" />
              <div className="bg-muted h-4 w-4 rounded" />
              <div className="bg-muted h-4 w-20 rounded" />
            </div>
            <div className="bg-muted h-3 w-16 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="px-component-lg py-component-sm">
      {/* Header */}
      <div className="mb-component-sm flex items-center justify-between">
        <p className="font-display text-muted-foreground text-xs font-semibold uppercase tracking-wide">
          {t('interfaces.title')}
        </p>
        {hasMore && (
          <button className="text-primary gap-component-xs hover:text-primary/80 focus-visible:ring-ring px-component-sm flex min-h-[44px] items-center rounded-lg text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2">
            {t('button.viewAll', { ns: 'common' })}
            <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Interface List */}
      <div className="space-y-0">
        {displayedInterfaces.length === 0 ?
          <p className="text-muted-foreground py-4 text-center text-sm">
            {t('interfaces.notFound')}
          </p>
        : displayedInterfaces.map((iface) => (
            <InterfaceListItem
              key={iface.id}
              iface={iface}
            />
          ))
        }
      </div>
    </div>
  );
});

InterfaceCompactList.displayName = 'InterfaceCompactList';
