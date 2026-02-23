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

export const InterfaceGridCard = React.memo(function InterfaceGridCard({ interface: iface }: InterfaceGridCardProps) {
  const { t } = useTranslation('network');
  const [isExpanded, setIsExpanded] = useState(false);
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';
  const { data: trafficStats } = useInterfaceTraffic(routerIp, iface.id);

  const isRunning = iface.status === 'running';
  const isLinkUp = iface.linkStatus === 'up';

  return (
    <div className={cn(
      'bg-card border rounded-xl transition-all duration-200',
      isRunning && isLinkUp ? 'border-border hover:border-success/50' :
      isRunning ? 'border-warning/30' : 'border-border opacity-60'
    )}>
      <button onClick={() => setIsExpanded(!isExpanded)} className="w-full text-left p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className={cn('block w-2 h-2 rounded-full',
                isRunning && isLinkUp ? 'bg-success' : isRunning ? 'bg-warning' : 'bg-muted-foreground'
              )} />
              {isRunning && isLinkUp && (
                <span className="absolute inset-0 w-2 h-2 rounded-full bg-success animate-ping opacity-75" />
              )}
            </div>
            <InterfaceTypeIcon type={iface.type} className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium text-foreground text-sm">{iface.name}</span>
          </div>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
        {trafficStats && !isExpanded && (
          <div className="flex items-center gap-3 mt-2 text-xs font-mono text-muted-foreground">
            <span className="flex items-center gap-1">
              <ArrowDown className="w-3 h-3 text-cyan-500" />{formatBytes(trafficStats.rxBytes)}
            </span>
            <span className="flex items-center gap-1">
              <ArrowUp className="w-3 h-3 text-purple-500" />{formatBytes(trafficStats.txBytes)}
            </span>
          </div>
        )}
      </button>
      {isExpanded && (
        <div className="px-3 pb-3 pt-0 border-t border-border">
          <div className="pt-3 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('interfaces.type')}</span>
              <span className="text-foreground capitalize">{iface.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('interfaces.mac')}</span>
              <span className="text-foreground font-mono">{iface.macAddress || t('common.notAvailable', { ns: 'common' })}</span>
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
                  <span className="text-foreground font-mono">{trafficStats.rxPackets.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('traffic.txPackets')}</span>
                  <span className="text-foreground font-mono">{trafficStats.txPackets.toLocaleString()}</span>
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

























