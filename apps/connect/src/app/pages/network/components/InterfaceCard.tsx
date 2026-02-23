/**
 * Interface Card Component
 * Dashboard Pro style - displays network interface with inline traffic stats
 */

import { memo, useState } from 'react';

import { ChevronDown, ChevronUp, RefreshCw, ArrowDown, ArrowUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useInterfaceTraffic } from '@nasnet/api-client/queries';
import { type NetworkInterface } from '@nasnet/core/types';
import { formatBytes } from '@nasnet/core/utils';
import { useConnectionStore } from '@nasnet/state/stores';

import { cn } from '@nasnet/ui/utils';

import { InterfaceTypeIcon } from './InterfaceTypeIcon';
import { TrafficIndicator } from './TrafficIndicator';

interface InterfaceCardProps {
  interface: NetworkInterface;
}

export const InterfaceCard = memo(function InterfaceCard({ interface: iface }: InterfaceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useTranslation('network');
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';

  const { data: trafficStats, isLoading: isLoadingStats } = useInterfaceTraffic(
    routerIp,
    iface.id
  );

  const isRunning = iface.status === 'running';
  const isLinkUp = iface.linkStatus === 'up';

  return (
    <div
      className={cn(
        'bg-card border rounded-xl transition-all duration-200',
        isRunning
          ? 'border-border hover:border-border/80'
          : 'border-border opacity-60'
      )}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-3 md:p-4 min-h-[44px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
        aria-expanded={isExpanded}
        aria-label={`${iface.name} interface details, ${isRunning ? 'running' : 'disabled'}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Status Dot */}
            <div className="relative">
              <span
                className={cn(
                  'block w-2.5 h-2.5 rounded-full',
                  isRunning && isLinkUp
                    ? 'bg-success'
                    : isRunning
                      ? 'bg-warning'
                      : 'bg-muted-foreground'
                )}
              />
              {isRunning && isLinkUp && (
                <span className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-success animate-ping opacity-75" />
              )}
            </div>

            {/* Interface Info */}
            <div className="flex items-center gap-2">
              <InterfaceTypeIcon
                type={iface.type}
                className="w-4 h-4 text-muted-foreground"
              />
              <div>
                <span className="font-medium text-foreground text-sm">
                  {iface.name}
                </span>
                <span className="text-xs text-muted-foreground ml-2 capitalize">
                  {iface.type}
                </span>
              </div>
            </div>
          </div>

          {/* Right Side - Traffic Stats or Chevron */}
          <div className="flex items-center gap-3">
            {trafficStats && !isExpanded && (
              <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ArrowDown className="w-3 h-3 text-success" aria-hidden="true" />
                  {formatBytes(trafficStats.rxBytes)}
                </span>
                <span className="flex items-center gap-1">
                  <ArrowUp className="w-3 h-3 text-category-monitoring" aria-hidden="true" />
                  {formatBytes(trafficStats.txBytes)}
                </span>
              </div>
            )}
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            )}
          </div>
        </div>

        {/* MAC Address - always visible */}
        <div className="mt-2 text-xs font-mono text-muted-foreground pl-5">
          {iface.macAddress || t('interfaces.noMac')}
          {iface.mtu && <span className="ml-3">{t('interfaces.mtu')}: {iface.mtu}</span>}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 pb-3 md:px-4 md:pb-4 pt-0 border-t border-border">
          <div className="pt-3 space-y-3">
            {/* Traffic Statistics */}
            {isLoadingStats ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-2" role="status" aria-label={t('traffic.loading')}>
                <RefreshCw className="w-3 h-3 animate-spin" aria-hidden="true" />
                <span>{t('traffic.loading')}</span>
              </div>
            ) : trafficStats ? (
              <div className="space-y-3">
                <TrafficIndicator
                  txBytes={trafficStats.txBytes}
                  rxBytes={trafficStats.rxBytes}
                  showLabels
                />

                {/* Packet Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-muted rounded-lg p-2">
                    <p className="text-muted-foreground">{t('traffic.rxPackets')}</p>
                    <p className="font-mono text-foreground">
                      {trafficStats.rxPackets.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-muted rounded-lg p-2">
                    <p className="text-muted-foreground">{t('traffic.txPackets')}</p>
                    <p className="font-mono text-foreground">
                      {trafficStats.txPackets.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Errors & Drops */}
                {(trafficStats.txErrors > 0 || trafficStats.rxErrors > 0 ||
                  trafficStats.txDrops > 0 || trafficStats.rxDrops > 0) && (
                  <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-2 text-xs" role="alert">
                    <p className="text-destructive font-medium mb-1">
                      {t('traffic.issuesDetected')}
                    </p>
                    <div className="grid grid-cols-2 gap-1 text-destructive">
                      {trafficStats.rxErrors > 0 && (
                        <span>{t('traffic.rxErrors')}: {trafficStats.rxErrors}</span>
                      )}
                      {trafficStats.txErrors > 0 && (
                        <span>{t('traffic.txErrors')}: {trafficStats.txErrors}</span>
                      )}
                      {trafficStats.rxDrops > 0 && (
                        <span>{t('traffic.rxDrops')}: {trafficStats.rxDrops}</span>
                      )}
                      {trafficStats.txDrops > 0 && (
                        <span>{t('traffic.txDrops')}: {trafficStats.txDrops}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-2">
                {t('traffic.noData')}
              </p>
            )}

            {/* Additional Details */}
            {iface.comment && (
              <div className="text-xs">
                <span className="text-muted-foreground">{t('interfaces.comment')}: </span>
                <span className="text-foreground">{iface.comment}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

InterfaceCard.displayName = 'InterfaceCard';
