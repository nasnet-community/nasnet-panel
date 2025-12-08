/**
 * Interface Compact List Component
 * Dashboard Pro style - Compact list view for interfaces
 */

import { NetworkInterface } from '@nasnet/core/types';
import { useInterfaceTraffic } from '@nasnet/api-client/queries';
import { useConnectionStore } from '@nasnet/state/stores';
import { formatBytes } from '@nasnet/core/utils';
import { InterfaceTypeIcon } from './InterfaceTypeIcon';
import { ChevronRight, ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InterfaceCompactListProps {
  interfaces: NetworkInterface[];
  isLoading?: boolean;
  maxItems?: number;
}

function InterfaceListItem({ iface }: { iface: NetworkInterface }) {
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';
  const { data: trafficStats } = useInterfaceTraffic(routerIp, iface.id);

  const isRunning = iface.status === 'running';
  const isLinkUp = iface.linkStatus === 'up';

  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-800 last:border-b-0">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'w-2 h-2 rounded-full',
            isRunning && isLinkUp ? 'bg-emerald-400' : isRunning ? 'bg-amber-400' : 'bg-slate-600'
          )}
        />
        <InterfaceTypeIcon type={iface.type} className="w-3.5 h-3.5 text-slate-500" />
        <span className="text-white text-sm">{iface.name}</span>
      </div>
      <div className="flex items-center gap-3">
        {trafficStats && isRunning && isLinkUp ? (
          <span className="text-slate-400 text-xs font-mono flex items-center gap-2">
            <span className="flex items-center gap-0.5">
              <ArrowDown className="w-3 h-3 text-cyan-400" />
              {formatBytes(trafficStats.rxBytes)}
            </span>
            <span className="flex items-center gap-0.5">
              <ArrowUp className="w-3 h-3 text-purple-400" />
              {formatBytes(trafficStats.txBytes)}
            </span>
          </span>
        ) : (
          <span className="text-slate-500 text-xs">
            {isRunning && isLinkUp ? 'Active' : isRunning ? 'No link' : 'Disabled'}
          </span>
        )}
      </div>
    </div>
  );
}

export function InterfaceCompactList({
  interfaces,
  isLoading,
  maxItems = 5,
}: InterfaceCompactListProps) {
  const displayedInterfaces = interfaces.slice(0, maxItems);
  const hasMore = interfaces.length > maxItems;

  if (isLoading) {
    return (
      <div className="px-4 py-2 space-y-3 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-slate-700 rounded-full" />
              <div className="w-4 h-4 bg-slate-700 rounded" />
              <div className="h-4 bg-slate-700 rounded w-20" />
            </div>
            <div className="h-3 bg-slate-700 rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 py-2">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <p className="text-slate-400 text-xs uppercase tracking-wide">Interfaces</p>
        {hasMore && (
          <button className="text-primary-400 text-xs flex items-center gap-0.5 hover:text-primary-300 transition-colors">
            View All
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Interface List */}
      <div className="space-y-0">
        {displayedInterfaces.length === 0 ? (
          <p className="text-slate-500 text-sm py-4 text-center">No interfaces found</p>
        ) : (
          displayedInterfaces.map((iface) => (
            <InterfaceListItem key={iface.id} iface={iface} />
          ))
        )}
      </div>
    </div>
  );
}





