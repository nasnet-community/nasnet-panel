/**
 * Interface Grid Card Component
 * Card-Heavy design - Compact interface card for grid layout
 */

import { useState } from 'react';

import { ChevronDown, ChevronUp, ArrowDown, ArrowUp } from 'lucide-react';

import { useInterfaceTraffic } from '@nasnet/api-client/queries';
import { type NetworkInterface } from '@nasnet/core/types';
import { formatBytes } from '@nasnet/core/utils';
import { useConnectionStore } from '@nasnet/state/stores';

import { cn } from '@/lib/utils';

import { InterfaceTypeIcon } from './InterfaceTypeIcon';

interface InterfaceGridCardProps {
  interface: NetworkInterface;
}

export function InterfaceGridCard({ interface: iface }: InterfaceGridCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';
  const { data: trafficStats } = useInterfaceTraffic(routerIp, iface.id);

  const isRunning = iface.status === 'running';
  const isLinkUp = iface.linkStatus === 'up';

  return (
    <div className={cn(
      'bg-white dark:bg-slate-900 border rounded-xl transition-all duration-200',
      isRunning && isLinkUp ? 'border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700' :
      isRunning ? 'border-amber-200 dark:border-amber-800' : 'border-slate-200 dark:border-slate-800 opacity-60'
    )}>
      <button onClick={() => setIsExpanded(!isExpanded)} className="w-full text-left p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className={cn('block w-2 h-2 rounded-full',
                isRunning && isLinkUp ? 'bg-emerald-500' : isRunning ? 'bg-amber-500' : 'bg-slate-400'
              )} />
              {isRunning && isLinkUp && (
                <span className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-75" />
              )}
            </div>
            <InterfaceTypeIcon type={iface.type} className="w-4 h-4 text-slate-400" />
            <span className="font-medium text-slate-900 dark:text-white text-sm">{iface.name}</span>
          </div>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
        {trafficStats && !isExpanded && (
          <div className="flex items-center gap-3 mt-2 text-xs font-mono text-slate-500">
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
        <div className="px-3 pb-3 pt-0 border-t border-slate-100 dark:border-slate-800">
          <div className="pt-3 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Type</span>
              <span className="text-slate-700 dark:text-slate-300 capitalize">{iface.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">MAC</span>
              <span className="text-slate-700 dark:text-slate-300 font-mono">{iface.macAddress || 'N/A'}</span>
            </div>
            {iface.mtu && (
              <div className="flex justify-between">
                <span className="text-slate-500">MTU</span>
                <span className="text-slate-700 dark:text-slate-300">{iface.mtu}</span>
              </div>
            )}
            {trafficStats && (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-500">RX Packets</span>
                  <span className="text-slate-700 dark:text-slate-300 font-mono">{trafficStats.rxPackets.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">TX Packets</span>
                  <span className="text-slate-700 dark:text-slate-300 font-mono">{trafficStats.txPackets.toLocaleString()}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

























