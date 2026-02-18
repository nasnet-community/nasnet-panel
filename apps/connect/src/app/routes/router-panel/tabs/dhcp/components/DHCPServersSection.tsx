/**
 * DHCP Servers Section Component
 * Compact server list with key metrics and status
 */

import { Network, Clock, Server } from 'lucide-react';

import type { DHCPServer, DHCPPool } from '@nasnet/core/types';
import { formatLeaseTime } from '@nasnet/core/utils';

interface DHCPServersSectionProps {
  servers: DHCPServer[];
  pools: DHCPPool[];
  isLoading?: boolean;
  className?: string;
}

/**
 * Find pool by name for a server
 */
function findPoolForServer(server: DHCPServer, pools: DHCPPool[]): DHCPPool | undefined {
  return pools.find(p => p.name === server.addressPool);
}

export function DHCPServersSection({ 
  servers, 
  pools, 
  isLoading = false,
  className = '' 
}: DHCPServersSectionProps) {
  if (isLoading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg" />
              <div className="flex-1">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-2" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (servers.length === 0) {
    return (
      <div className={`bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center ${className}`}>
        <Server className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          No DHCP servers configured
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {servers.map((server) => {
        const pool = findPoolForServer(server, pools);
        const isActive = !server.disabled;

        return (
          <div
            key={server.id}
            className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 transition-all ${
              !isActive ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              {/* Left: Icon and Name */}
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isActive 
                    ? 'bg-blue-500/10 dark:bg-blue-500/20' 
                    : 'bg-slate-200 dark:bg-slate-700'
                }`}>
                  <Network className={`w-5 h-5 ${isActive ? 'text-blue-500' : 'text-slate-400'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                      {server.name}
                    </h3>
                    {server.authoritative && (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-info/10 text-info rounded">
                        AUTH
                      </span>
                    )}
                    {!isActive && (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-200 dark:bg-slate-700 text-slate-500 rounded">
                        DISABLED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Interface: {server.interface}
                  </p>
                </div>
              </div>

              {/* Right: Quick Stats */}
              <div className="flex items-center gap-4 text-right">
                <div>
                  <div className="flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <p className="text-xs text-slate-500 dark:text-slate-400">Lease</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {formatLeaseTime(server.leaseTime)}
                  </p>
                </div>
                {pool && (
                  <div className="hidden sm:block">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Pool</p>
                    <p className="text-sm font-mono text-slate-900 dark:text-white truncate max-w-[120px]">
                      {pool.ranges[0]}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

























