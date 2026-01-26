/**
 * DHCP Pool Summary Component
 * Shows pool utilization, active leases, and available IPs
 */

import { useMemo } from 'react';
import type { DHCPServer, DHCPLease, DHCPPool } from '@nasnet/core/types';
import { Server, Users, PieChart, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DHCPPoolSummaryProps {
  servers: DHCPServer[];
  leases: DHCPLease[];
  pools: DHCPPool[];
  isLoading?: boolean;
  error?: Error | null;
}

function calculatePoolSize(ranges: string[]): number {
  let total = 0;
  for (const range of ranges) {
    const [start, end] = range.split('-').map(ip => ip.trim());
    if (!end) { total += 1; continue; }
    const startOctets = start.split('.').map(Number);
    const endOctets = end.split('.').map(Number);
    const startNum = (startOctets[0] << 24) + (startOctets[1] << 16) + (startOctets[2] << 8) + startOctets[3];
    const endNum = (endOctets[0] << 24) + (endOctets[1] << 16) + (endOctets[2] << 8) + endOctets[3];
    total += (endNum - startNum) + 1;
  }
  return total;
}

export function DHCPPoolSummary({ servers, leases, pools, isLoading, error }: DHCPPoolSummaryProps) {
  const stats = useMemo(() => {
    const activeLeases = leases.filter(lease => lease.status === 'bound').length;
    const totalPoolSize = pools.reduce((acc, pool) => acc + calculatePoolSize(pool.ranges), 0);
    const availableIPs = Math.max(0, totalPoolSize - activeLeases);
    const utilizationPercent = totalPoolSize > 0 ? Math.round((activeLeases / totalPoolSize) * 100) : 0;
    const activeServers = servers.filter(s => !s.disabled).length;
    return { activeLeases, totalPoolSize, availableIPs, utilizationPercent, activeServers, totalServers: servers.length };
  }, [servers, leases, pools]);

  const getUtilizationColor = (percent: number) => {
    if (percent >= 90) return 'text-red-500';
    if (percent >= 70) return 'text-amber-500';
    return 'text-emerald-500';
  };

  const getUtilizationBarColor = (percent: number) => {
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 70) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-32" />
        </div>
        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full mb-4" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center">
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-12 mx-auto mb-1" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-16 mx-auto" />
            </div>
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
          <span className="text-sm font-medium">Failed to load DHCP data</span>
        </div>
        <p className="text-xs text-red-500/70 mt-1">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Server className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">DHCP Pool Status</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{stats.activeServers}/{stats.totalServers} servers active</p>
          </div>
        </div>
        <span className={cn('text-lg font-bold', getUtilizationColor(stats.utilizationPercent))}>{stats.utilizationPercent}%</span>
      </div>
      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 mb-4">
        <div className={cn('h-2 rounded-full transition-all duration-300', getUtilizationBarColor(stats.utilizationPercent))} style={{ width: `${Math.min(stats.utilizationPercent, 100)}%` }} />
      </div>
      <div className="grid grid-cols-4 gap-2">
        <div className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <Users className="w-3 h-3 text-cyan-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-slate-900 dark:text-white">{stats.activeLeases}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Active</p>
        </div>
        <div className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <PieChart className="w-3 h-3 text-emerald-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-slate-900 dark:text-white">{stats.availableIPs}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Available</p>
        </div>
        <div className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <p className="text-lg font-bold text-slate-900 dark:text-white">{stats.totalPoolSize}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
        </div>
        <div className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <p className="text-lg font-bold text-slate-900 dark:text-white">{pools.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Pools</p>
        </div>
      </div>
    </div>
  );
}

























