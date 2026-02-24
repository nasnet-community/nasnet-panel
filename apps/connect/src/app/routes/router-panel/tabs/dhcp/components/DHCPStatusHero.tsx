/**
 * DHCP Status Hero Component
 * Dashboard Pro style stats grid showing DHCP overview metrics
 */

import React, { useMemo } from 'react';

import { Users, PieChart, Server, Network, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';


import type { DHCPServer, DHCPLease, DHCPPool, DHCPClient } from '@nasnet/core/types';

import { calculatePoolSize, getUtilizationTextColor, getUtilizationBgColor } from '../utils';

interface DHCPStatusHeroProps {
  servers: DHCPServer[];
  leases: DHCPLease[];
  pools: DHCPPool[];
  clients: DHCPClient[];
  isLoading?: boolean;
}

export const DHCPStatusHero = React.memo(function DHCPStatusHero({
  servers,
  leases,
  pools,
  clients,
  isLoading,
}: DHCPStatusHeroProps) {
  const { t } = useTranslation('network');
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
            className="bg-muted rounded-xl p-3 md:p-4 hidden md:block first:block [&:nth-child(2)]:block [&:nth-child(3)]:block"
          >
            <div className="h-4 bg-muted/50 rounded w-12 mb-2" />
            <div className="h-6 bg-muted/50 rounded w-8 mb-1" />
            <div className="h-1.5 bg-muted/50 rounded-full mt-2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
      {/* Active Leases */}
      <div className="bg-card rounded-xl p-3 md:p-4 border border-border">
        <div className="flex items-center gap-1.5 mb-1">
          <Users className="w-3.5 h-3.5 text-category-network" />
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            {t('dhcp.hero.active')}
          </p>
        </div>
        <p className="text-xl md:text-2xl font-bold text-foreground">
          {activeLeases}
          <span className="text-muted-foreground text-sm font-normal ml-1">
            /{totalPoolSize}
          </span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {t('dhcp.hero.leases')}
        </p>
      </div>

      {/* Pool Utilization */}
      <div className="bg-card rounded-xl p-3 md:p-4 border border-border">
        <div className="flex items-center gap-1.5 mb-1">
          <PieChart className="w-3.5 h-3.5 text-success" />
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            {t('dhcp.hero.used')}
          </p>
        </div>
        <p className={`text-xl md:text-2xl font-bold ${utilizationColor}`}>
          {utilizationPercent}%
        </p>
        <div className="w-full bg-muted rounded-full h-1.5 mt-2">
          <div
            className={`${utilizationBarColor} h-1.5 rounded-full transition-all duration-300`}
            style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
            role="progressbar"
            aria-valuenow={utilizationPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {/* Available IPs */}
      <div className="bg-card rounded-xl p-3 md:p-4 border border-border">
        <div className="flex items-center gap-1.5 mb-1">
          <Server className="w-3.5 h-3.5 text-category-system" />
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            {t('dhcp.hero.available')}
          </p>
        </div>
        <p className="text-xl md:text-2xl font-bold text-foreground font-mono">
          {availableIPs}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {t('dhcp.hero.ipAddresses')}
        </p>
      </div>

      {/* DHCP Servers */}
      <div className="bg-card rounded-xl p-3 md:p-4 border border-border hidden md:block">
        <div className="flex items-center gap-1.5 mb-1">
          <Network className="w-3.5 h-3.5 text-category-dhcp" />
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            {t('dhcp.hero.servers')}
          </p>
        </div>
        <p className="text-xl md:text-2xl font-bold text-foreground">
          {activeServers}
          <span className="text-muted-foreground text-sm font-normal ml-1">
            /{servers.length}
          </span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {t('dhcp.hero.active')}
        </p>
      </div>

      {/* WAN Clients Status */}
      <div className="bg-card rounded-xl p-3 md:p-4 border border-border hidden md:block">
        <div className="flex items-center gap-1.5 mb-1">
          <Globe className="w-3.5 h-3.5 text-success" />
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            {t('dhcp.hero.wan')}
          </p>
        </div>
        <p className="text-xl md:text-2xl font-bold text-foreground">
          {boundClients}
          <span className="text-muted-foreground text-sm font-normal ml-1">
            /{totalClients}
          </span>
        </p>
        <p className={`text-xs mt-1 ${boundClients === totalClients ? 'text-success' : 'text-warning'}`}>
          {boundClients === totalClients ? t('dhcp.hero.allConnected') : t('dhcp.hero.partial')}
        </p>
      </div>
    </div>
  );
});

DHCPStatusHero.displayName = 'DHCPStatusHero';
















