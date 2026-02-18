/**
 * Interface Card Component
 * Dashboard Pro style - displays network interface with inline traffic stats
 */

import { useState } from 'react';

import { ChevronDown, ChevronUp, RefreshCw, ArrowDown, ArrowUp } from 'lucide-react';

import { useInterfaceTraffic } from '@nasnet/api-client/queries';
import { type NetworkInterface } from '@nasnet/core/types';
import { formatBytes } from '@nasnet/core/utils';
import { useConnectionStore } from '@nasnet/state/stores';

import { cn } from '@/lib/utils';

import { InterfaceTypeIcon } from './InterfaceTypeIcon';
import { TrafficIndicator } from './TrafficIndicator';

interface InterfaceCardProps {
  interface: NetworkInterface;
}

export function InterfaceCard({ interface: iface }: InterfaceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
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
        'bg-white dark:bg-slate-900 border rounded-xl transition-all duration-200',
        isRunning
          ? 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
          : 'border-slate-200 dark:border-slate-800 opacity-60'
      )}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-3 md:p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Status Dot */}
            <div className="relative">
              <span
                className={cn(
                  'block w-2.5 h-2.5 rounded-full',
                  isRunning && isLinkUp
                    ? 'bg-emerald-500'
                    : isRunning
                      ? 'bg-amber-500'
                      : 'bg-slate-400 dark:bg-slate-600'
                )}
              />
              {isRunning && isLinkUp && (
                <span className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping opacity-75" />
              )}
            </div>

            {/* Interface Info */}
            <div className="flex items-center gap-2">
              <InterfaceTypeIcon
                type={iface.type}
                className="w-4 h-4 text-slate-500 dark:text-slate-400"
              />
              <div>
                <span className="font-medium text-slate-900 dark:text-white text-sm">
                  {iface.name}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 ml-2 capitalize">
                  {iface.type}
                </span>
              </div>
            </div>
          </div>

          {/* Right Side - Traffic Stats or Chevron */}
          <div className="flex items-center gap-3">
            {trafficStats && !isExpanded && (
              <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <ArrowDown className="w-3 h-3 text-emerald-500" />
                  {formatBytes(trafficStats.rxBytes)}
                </span>
                <span className="flex items-center gap-1">
                  <ArrowUp className="w-3 h-3 text-purple-500" />
                  {formatBytes(trafficStats.txBytes)}
                </span>
              </div>
            )}
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </div>

        {/* MAC Address - always visible */}
        <div className="mt-2 text-xs font-mono text-slate-400 dark:text-slate-500 pl-5">
          {iface.macAddress || 'No MAC'}
          {iface.mtu && <span className="ml-3">MTU: {iface.mtu}</span>}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 pb-3 md:px-4 md:pb-4 pt-0 border-t border-slate-100 dark:border-slate-800">
          <div className="pt-3 space-y-3">
            {/* Traffic Statistics */}
            {isLoadingStats ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 py-2">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Loading traffic...</span>
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
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
                    <p className="text-slate-400 dark:text-slate-500">RX Packets</p>
                    <p className="font-mono text-slate-700 dark:text-slate-300">
                      {trafficStats.rxPackets.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
                    <p className="text-slate-400 dark:text-slate-500">TX Packets</p>
                    <p className="font-mono text-slate-700 dark:text-slate-300">
                      {trafficStats.txPackets.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Errors & Drops */}
                {(trafficStats.txErrors > 0 || trafficStats.rxErrors > 0 ||
                  trafficStats.txDrops > 0 || trafficStats.rxDrops > 0) && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2 text-xs">
                    <p className="text-red-700 dark:text-red-400 font-medium mb-1">
                      Issues Detected
                    </p>
                    <div className="grid grid-cols-2 gap-1 text-red-600 dark:text-red-400">
                      {trafficStats.rxErrors > 0 && (
                        <span>RX Errors: {trafficStats.rxErrors}</span>
                      )}
                      {trafficStats.txErrors > 0 && (
                        <span>TX Errors: {trafficStats.txErrors}</span>
                      )}
                      {trafficStats.rxDrops > 0 && (
                        <span>RX Drops: {trafficStats.rxDrops}</span>
                      )}
                      {trafficStats.txDrops > 0 && (
                        <span>TX Drops: {trafficStats.txDrops}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-2">
                No traffic data available
              </p>
            )}

            {/* Additional Details */}
            {iface.comment && (
              <div className="text-xs">
                <span className="text-slate-400 dark:text-slate-500">Comment: </span>
                <span className="text-slate-600 dark:text-slate-300">{iface.comment}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
