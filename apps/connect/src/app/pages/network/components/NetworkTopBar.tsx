/**
 * Network Top Bar Component
 * Dashboard Pro style - Compact header with router identity and status
 */

import { SystemInfo } from '@nasnet/core/types';
import { MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

type NetworkStatus = 'healthy' | 'warning' | 'error' | 'loading';

interface NetworkTopBarProps {
  routerInfo?: SystemInfo;
  networkStatus: NetworkStatus;
  isLoading?: boolean;
}

export function NetworkTopBar({
  routerInfo,
  networkStatus,
  isLoading,
}: NetworkTopBarProps) {
  const statusConfig = {
    healthy: { label: 'Online', dotClass: 'bg-emerald-400', textClass: 'text-emerald-400' },
    warning: { label: 'Degraded', dotClass: 'bg-amber-400', textClass: 'text-amber-400' },
    error: { label: 'Offline', dotClass: 'bg-red-400', textClass: 'text-red-400' },
    loading: { label: 'Connecting', dotClass: 'bg-slate-400', textClass: 'text-slate-400' },
  };

  const status = statusConfig[networkStatus];

  if (isLoading) {
    return (
      <div className="flex justify-between items-center px-4 py-3 border-b border-slate-800 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-700 rounded-lg" />
          <div className="space-y-1">
            <div className="h-4 bg-slate-700 rounded w-24" />
            <div className="h-3 bg-slate-800 rounded w-16" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-between items-center px-4 py-3 border-b border-slate-800">
      <div className="flex items-center gap-3">
        {/* Router Logo/Icon */}
        <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-sm font-bold text-slate-900">
          N
        </div>
        
        {/* Router Identity */}
        <div>
          <p className="text-white text-sm font-medium">
            {routerInfo?.identity || 'Router'}
          </p>
          <div className="flex items-center gap-1.5">
            <span className={cn('w-1.5 h-1.5 rounded-full', status.dotClass)} />
            <span className={cn('text-xs', status.textClass)}>{status.label}</span>
            {routerInfo?.routerOsVersion && (
              <>
                <span className="text-slate-600 text-xs">•</span>
                <span className="text-slate-500 text-xs">v{routerInfo.routerOsVersion}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Menu Button */}
      <button className="p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors">
        <MoreVertical className="w-4 h-4" />
      </button>
    </div>
  );
}






