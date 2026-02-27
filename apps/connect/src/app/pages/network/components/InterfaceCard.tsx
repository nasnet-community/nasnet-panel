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

  const { data: trafficStats, isLoading: isLoadingStats } = useInterfaceTraffic(routerIp, iface.id);

  const isRunning = iface.status === 'running';
  const isLinkUp = iface.linkStatus === 'up';

  return (
    <div
      className={cn(
        'bg-card rounded-card-lg border shadow-sm transition-all duration-200',
        isRunning ? 'border-border hover:border-border/80' : 'border-border opacity-60'
      )}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-component-md md:p-component-lg focus-visible:ring-ring rounded-card-sm min-h-[44px] w-full text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        aria-expanded={isExpanded}
        aria-label={`${iface.name} interface details, ${isRunning ? 'running' : 'disabled'}`}
      >
        <div className="flex items-center justify-between">
          <div className="gap-component-md flex items-center">
            {/* Status Dot */}
            <div className="relative">
              <span
                className={cn(
                  'block h-2.5 w-2.5 rounded-full',
                  isRunning && isLinkUp ? 'bg-success'
                  : isRunning ? 'bg-warning'
                  : 'bg-muted-foreground'
                )}
              />
              {isRunning && isLinkUp && (
                <span className="bg-success absolute inset-0 h-2.5 w-2.5 animate-ping rounded-full opacity-75" />
              )}
            </div>

            {/* Interface Info */}
            <div className="gap-component-sm flex items-center">
              <InterfaceTypeIcon
                type={iface.type}
                className="text-muted-foreground h-4 w-4"
              />
              <div>
                <span className="font-display text-foreground text-sm font-semibold">
                  {iface.name}
                </span>
                <span className="text-muted-foreground ml-2 text-xs capitalize">{iface.type}</span>
              </div>
            </div>
          </div>

          {/* Right Side - Traffic Stats or Chevron */}
          <div className="gap-component-md flex items-center">
            {trafficStats && !isExpanded && (
              <div className="gap-component-md text-muted-foreground hidden items-center font-mono text-xs sm:flex">
                <span className="gap-component-xs flex items-center">
                  <ArrowDown
                    className="text-success h-3 w-3"
                    aria-hidden="true"
                  />
                  {formatBytes(trafficStats.rxBytes)}
                </span>
                <span className="flex items-center gap-1">
                  <ArrowUp
                    className="text-category-monitoring h-3 w-3"
                    aria-hidden="true"
                  />
                  {formatBytes(trafficStats.txBytes)}
                </span>
              </div>
            )}
            {isExpanded ?
              <ChevronUp
                className="text-muted-foreground h-4 w-4"
                aria-hidden="true"
              />
            : <ChevronDown
                className="text-muted-foreground h-4 w-4"
                aria-hidden="true"
              />
            }
          </div>
        </div>

        {/* MAC Address - always visible */}
        <div className="text-muted-foreground mt-2 pl-5 font-mono text-xs">
          {iface.macAddress || t('interfaces.noMac')}
          {iface.mtu && (
            <span className="ml-3 font-mono">
              {t('interfaces.mtu')}: {iface.mtu}
            </span>
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-component-md pb-component-md md:px-component-lg md:pb-component-lg border-border border-t pt-0">
          <div className="pt-component-md space-y-component-md">
            {/* Traffic Statistics */}
            {isLoadingStats ?
              <div
                className="text-muted-foreground flex items-center gap-2 py-2 text-xs"
                role="status"
                aria-label={t('traffic.loading')}
              >
                <RefreshCw
                  className="h-3 w-3 animate-spin"
                  aria-hidden="true"
                />
                <span>{t('traffic.loading')}</span>
              </div>
            : trafficStats ?
              <div className="space-y-3">
                <TrafficIndicator
                  txBytes={trafficStats.txBytes}
                  rxBytes={trafficStats.rxBytes}
                  showLabels
                />

                {/* Packet Stats */}
                <div className="gap-component-sm grid grid-cols-2 text-xs">
                  <div className="bg-muted rounded-card-sm p-component-sm">
                    <p className="text-muted-foreground">{t('traffic.rxPackets')}</p>
                    <p className="text-foreground font-mono">
                      {trafficStats.rxPackets.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-muted rounded-card-sm p-component-sm">
                    <p className="text-muted-foreground">{t('traffic.txPackets')}</p>
                    <p className="text-foreground font-mono">
                      {trafficStats.txPackets.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Errors & Drops */}
                {(trafficStats.txErrors > 0 ||
                  trafficStats.rxErrors > 0 ||
                  trafficStats.txDrops > 0 ||
                  trafficStats.rxDrops > 0) && (
                  <div
                    className="bg-error/10 border-error/30 rounded-card-sm p-component-sm border text-xs"
                    role="alert"
                  >
                    <p className="text-error mb-1 font-medium">{t('traffic.issuesDetected')}</p>
                    <div className="gap-component-xs text-error grid grid-cols-2">
                      {trafficStats.rxErrors > 0 && (
                        <span>
                          {t('traffic.rxErrors')}: {trafficStats.rxErrors}
                        </span>
                      )}
                      {trafficStats.txErrors > 0 && (
                        <span>
                          {t('traffic.txErrors')}: {trafficStats.txErrors}
                        </span>
                      )}
                      {trafficStats.rxDrops > 0 && (
                        <span>
                          {t('traffic.rxDrops')}: {trafficStats.rxDrops}
                        </span>
                      )}
                      {trafficStats.txDrops > 0 && (
                        <span>
                          {t('traffic.txDrops')}: {trafficStats.txDrops}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            : <p className="text-muted-foreground py-2 text-xs">{t('traffic.noData')}</p>}

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
