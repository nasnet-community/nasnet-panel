/**
 * Interface Grid Card Component
 * Card-Heavy design - Compact interface card for grid layout
 */

import React, { useState } from 'react';

import { ChevronDown, ChevronUp, ArrowDown, ArrowUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useInterfaceTraffic } from '@nasnet/api-client/queries';
import { type NetworkInterface } from '@nasnet/core/types';
import { formatBytes } from '@nasnet/core/utils';
import { useConnectionStore } from '@nasnet/state/stores';

import { cn } from '@nasnet/ui/utils';

import { InterfaceTypeIcon } from './InterfaceTypeIcon';

interface InterfaceGridCardProps {
  interface: NetworkInterface;
}

export const InterfaceGridCard = React.memo(function InterfaceGridCard({
  interface: iface,
}: InterfaceGridCardProps) {
  const { t } = useTranslation('network');
  const [isExpanded, setIsExpanded] = useState(false);
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';
  const { data: trafficStats } = useInterfaceTraffic(routerIp, iface.id);

  const isRunning = iface.status === 'running';
  const isLinkUp = iface.linkStatus === 'up';

  return (
    <div
      className={cn(
        'bg-card rounded-card-sm border shadow-sm transition-all duration-200',
        isRunning && isLinkUp ? 'border-border hover:border-success/50'
        : isRunning ? 'border-warning/30'
        : 'border-border opacity-60'
      )}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-component-md focus-visible:ring-ring rounded-card-sm hover:bg-muted/25 min-h-[44px] w-full text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center justify-between">
          <div className="gap-component-sm flex items-center">
            <div className="relative">
              <span
                className={cn(
                  'block h-2 w-2 rounded-full',
                  isRunning && isLinkUp ? 'bg-success'
                  : isRunning ? 'bg-warning'
                  : 'bg-muted-foreground'
                )}
                aria-hidden="true"
              />
              {isRunning && isLinkUp && (
                <span
                  className="bg-success absolute inset-0 h-2 w-2 animate-ping rounded-full opacity-75"
                  aria-hidden="true"
                />
              )}
            </div>
            <InterfaceTypeIcon
              type={iface.type}
              className="text-muted-foreground h-4 w-4"
            />
            <span className="font-display text-foreground text-sm font-semibold">{iface.name}</span>
          </div>
          {isExpanded ?
            <ChevronUp className="text-muted-foreground h-4 w-4" />
          : <ChevronDown className="text-muted-foreground h-4 w-4" />}
        </div>
        {trafficStats && !isExpanded && (
          <div className="gap-component-md mt-component-sm text-muted-foreground flex items-center font-mono text-xs">
            <span className="gap-component-xs flex items-center">
              <ArrowDown
                className="text-success h-3 w-3"
                aria-hidden="true"
              />
              {formatBytes(trafficStats.rxBytes)}
            </span>
            <span className="gap-component-xs flex items-center">
              <ArrowUp
                className="text-category-monitoring h-3 w-3"
                aria-hidden="true"
              />
              {formatBytes(trafficStats.txBytes)}
            </span>
          </div>
        )}
      </button>
      {isExpanded && (
        <div className="px-component-md pb-component-md border-border rounded-card-sm border-t pt-0">
          <div className="pt-component-md space-y-component-sm text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('interfaces.type')}</span>
              <span className="text-foreground capitalize">{iface.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('interfaces.mac')}</span>
              <span className="text-foreground break-all font-mono">
                {iface.macAddress || t('common.notAvailable', { ns: 'common' })}
              </span>
            </div>
            {iface.mtu && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('interfaces.mtu')}</span>
                <span className="text-foreground">{iface.mtu}</span>
              </div>
            )}
            {trafficStats && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('traffic.rxPackets')}</span>
                  <span className="text-foreground font-mono">
                    {trafficStats.rxPackets.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('traffic.txPackets')}</span>
                  <span className="text-foreground font-mono">
                    {trafficStats.txPackets.toLocaleString()}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

InterfaceGridCard.displayName = 'InterfaceGridCard';
