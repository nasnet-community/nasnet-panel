/**
 * DHCP Status Hero Component
 * Dashboard Pro style stats grid showing DHCP overview metrics
 */

import { useMemo } from 'react';
import type { DHCPServer, DHCPLease, DHCPPool, DHCPClient } from '@nasnet/core/types';
import { Users, PieChart, Server, Network, Globe } from 'lucide-react';
import { calculatePoolSize, getUtilizationTextColor, getUtilizationBgColor } from '../utils';

interface DHCPStatusHeroProps {
  servers: DHCPServer[];
  leases: DHCPLease[];
  pools: DHCPPool[];
  clients: DHCPClient[];
  isLoading?: boolean;
}

export function DHCPStatusHero({
  servers,
  leases,
  pools,
  clients,
  isLoading,
}: DHCPStatusHeroProps) {
  // Calculate metrics
  const activeLeases = useMemo(() => {
    return leases.filter(lease => lease.status === 'bound').length;
  }, [leases]);

  const totalPoolSize = useMemo(() => {
    return pools.reduce((acc, pool) => acc + calculatePoolSize(pool.ranges), 0);
  }, [pools]);

  const availableIPs = totalPoolSize - activeLeases;

  const utilizationPercent = totalPoolSize > 0 
    ? Math.round((activeLeases / totalPoolSize) * 100)
    : 0;

  const activeServers = servers.filter(s => !s.disabled).length;

  const boundClients = clients.filter(c => c.status === 'bound').length;
  const totalClients = clients.length;

  const utilizationColor = getUtilizationTextColor(utilizationPercent);
  const utilizationBarColor = getUtilizationBgColor(utilizationPercent);

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-3 animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-slate-100 dark:bg-slate-900 rounded-xl p-3 md:p-4 hidden md:block first:block [&:nth-child(2)]:block [&:nth-child(3)]:block"
          >
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-12 mb-2" />
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-8 mb-1" />
            <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
      {/* Active Leases */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-3 md:p-4 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5 mb-1">
          <Users className="w-3.5 h-3.5 text-cyan-500" />
          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
            Active
          </p>
        </div>
        <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
          {activeLeases}
          <span className="text-slate-400 dark:text-slate-500 text-sm font-normal ml-1">
            /{totalPoolSize}
          </span>
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Leases
        </p>
      </div>

      {/* Pool Utilization */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-3 md:p-4 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5 mb-1">
          <PieChart className="w-3.5 h-3.5 text-emerald-500" />
          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
            Used
          </p>
        </div>
        <p className={`text-xl md:text-2xl font-bold ${utilizationColor}`}>
          {utilizationPercent}%
        </p>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-2">
          <div
            className={`${utilizationBarColor} h-1.5 rounded-full transition-all duration-300`}
            style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Available IPs */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-3 md:p-4 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5 mb-1">
          <Server className="w-3.5 h-3.5 text-purple-500" />
          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
            Available
          </p>
        </div>
        <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white font-mono">
          {availableIPs}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          IP Addresses
        </p>
      </div>

      {/* DHCP Servers */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-3 md:p-4 border border-slate-200 dark:border-slate-800 hidden md:block">
        <div className="flex items-center gap-1.5 mb-1">
          <Network className="w-3.5 h-3.5 text-blue-500" />
          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
            Servers
          </p>
        </div>
        <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
          {activeServers}
          <span className="text-slate-400 dark:text-slate-500 text-sm font-normal ml-1">
            /{servers.length}
          </span>
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Active
        </p>
      </div>

      {/* WAN Clients Status */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-3 md:p-4 border border-slate-200 dark:border-slate-800 hidden md:block">
        <div className="flex items-center gap-1.5 mb-1">
          <Globe className="w-3.5 h-3.5 text-green-500" />
          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
            WAN
          </p>
        </div>
        <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
          {boundClients}
          <span className="text-slate-400 dark:text-slate-500 text-sm font-normal ml-1">
            /{totalClients}
          </span>
        </p>
        <p className={`text-xs mt-1 ${boundClients === totalClients ? 'text-green-500' : 'text-amber-500'}`}>
          {boundClients === totalClients ? 'All Connected' : 'Partial'}
        </p>
      </div>
    </div>
  );
}

























