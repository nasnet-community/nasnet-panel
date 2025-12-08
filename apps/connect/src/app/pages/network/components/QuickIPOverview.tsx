/**
 * Quick IP Overview Component
 * Light/dark theme support - Compact IP configuration view
 */

import { useMemo, useState } from 'react';
import { IPAddress } from '@nasnet/core/types';
import { Globe, ChevronDown, ChevronUp, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickIPOverviewProps {
  ipAddresses: IPAddress[];
  isLoading?: boolean;
  error?: Error | null;
}

export function QuickIPOverview({ ipAddresses, isLoading, error }: QuickIPOverviewProps) {
  const [expandedInterface, setExpandedInterface] = useState<string | null>(null);

  const groupedIPs = useMemo(() => {
    return ipAddresses.reduce((acc, ip) => {
      if (!acc[ip.interface]) acc[ip.interface] = [];
      acc[ip.interface].push(ip);
      return acc;
    }, {} as Record<string, IPAddress[]>);
  }, [ipAddresses]);

  const interfaceNames = Object.keys(groupedIPs);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-32" />
        </div>
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-800/50 p-4">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <XCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Failed to load IP addresses</span>
        </div>
        <p className="text-xs text-red-500/70 mt-1">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <Globe className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">IP Addresses</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{ipAddresses.length} configured</p>
          </div>
        </div>
      </div>

      {interfaceNames.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">No IP addresses configured</p>
        </div>
      ) : (
        <div className="space-y-2">
          {interfaceNames.map((ifaceName) => {
            const ips = groupedIPs[ifaceName];
            const isExpanded = expandedInterface === ifaceName;

            return (
              <div key={ifaceName} className="bg-slate-50 dark:bg-slate-800 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedInterface(isExpanded ? null : ifaceName)}
                  className="w-full flex items-center justify-between p-3 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{ifaceName}</span>
                    <span className="px-1.5 py-0.5 text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded">
                      {ips.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isExpanded && ips.length > 0 && (
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{ips[0].address}</span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>
                {isExpanded && (
                  <div className="px-3 pb-3 space-y-2">
                    {ips.map((ip) => (
                      <div key={ip.id} className="flex items-center justify-between py-1">
                        <span className="text-sm font-mono text-slate-700 dark:text-slate-300">{ip.address}</span>
                        <span className={cn('px-2 py-0.5 text-xs rounded',
                          ip.dynamic
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-400'
                        )}>
                          {ip.dynamic ? 'Dynamic' : 'Static'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
