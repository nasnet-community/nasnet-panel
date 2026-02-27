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
    return leases.filter((lease) => lease.status === 'bound').length;
  }, [leases]);

  const totalPoolSize = useMemo(() => {
    return pools.reduce((acc, pool) => acc + calculatePoolSize(pool.ranges), 0);
  }, [pools]);

  const availableIPs = totalPoolSize - activeLeases;

  const utilizationPercent =
    totalPoolSize > 0 ? Math.round((activeLeases / totalPoolSize) * 100) : 0;

  const activeServers = servers.filter((s) => !s.disabled).length;

  const boundClients = clients.filter((c) => c.status === 'bound').length;
  const totalClients = clients.length;

  const utilizationColor = getUtilizationTextColor(utilizationPercent);
  const utilizationBarColor = getUtilizationBgColor(utilizationPercent);

  if (isLoading) {
    return (
      <div className="grid animate-pulse grid-cols-3 gap-2 md:grid-cols-5 md:gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-muted hidden rounded-xl p-3 first:block md:block md:p-4 [&:nth-child(2)]:block [&:nth-child(3)]:block"
          >
            <div className="bg-muted/50 mb-2 h-4 w-12 rounded" />
            <div className="bg-muted/50 mb-1 h-6 w-8 rounded" />
            <div className="bg-muted/50 mt-2 h-1.5 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="category-hero-dhcp rounded-card-sm grid grid-cols-3 gap-2 p-6 shadow-md md:grid-cols-5 md:gap-3 md:p-8">
      {/* Active Leases */}
      <div className="bg-card border-border rounded-xl border p-3 md:p-4">
        <div className="mb-1 flex items-center gap-1.5">
          <Users
            className="text-category-network h-3.5 w-3.5"
            aria-hidden={true}
          />
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            {t('dhcp.hero.active')}
          </p>
        </div>
        <p className="text-foreground font-mono text-xl font-bold md:text-2xl">
          {activeLeases}
          <span className="text-muted-foreground ml-1 text-sm font-normal">/{totalPoolSize}</span>
        </p>
        <p className="text-muted-foreground mt-1 text-xs">{t('dhcp.hero.leases')}</p>
      </div>

      {/* Pool Utilization */}
      <div className="bg-card border-border rounded-xl border p-3 md:p-4">
        <div className="mb-1 flex items-center gap-1.5">
          <PieChart
            className="text-success h-3.5 w-3.5"
            aria-hidden={true}
          />
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            {t('dhcp.hero.used')}
          </p>
        </div>
        <p className={`font-mono text-xl font-bold md:text-2xl ${utilizationColor}`}>
          {utilizationPercent}%
        </p>
        <div className="bg-muted mt-2 h-1.5 w-full rounded-full">
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
      <div className="bg-card border-border rounded-xl border p-3 md:p-4">
        <div className="mb-1 flex items-center gap-1.5">
          <Server
            className="text-category-system h-3.5 w-3.5"
            aria-hidden={true}
          />
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            {t('dhcp.hero.available')}
          </p>
        </div>
        <p className="text-foreground font-mono text-xl font-bold md:text-2xl">{availableIPs}</p>
        <p className="text-muted-foreground mt-1 text-xs">{t('dhcp.hero.ipAddresses')}</p>
      </div>

      {/* DHCP Servers */}
      <div className="bg-card border-border hidden rounded-xl border p-3 md:block md:p-4">
        <div className="mb-1 flex items-center gap-1.5">
          <Network
            className="text-category-dhcp h-3.5 w-3.5"
            aria-hidden={true}
          />
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            {t('dhcp.hero.servers')}
          </p>
        </div>
        <p className="text-foreground font-mono text-xl font-bold md:text-2xl">
          {activeServers}
          <span className="text-muted-foreground ml-1 text-sm font-normal">/{servers.length}</span>
        </p>
        <p className="text-muted-foreground mt-1 text-xs">{t('dhcp.hero.active')}</p>
      </div>

      {/* WAN Clients Status */}
      <div className="bg-card border-border hidden rounded-xl border p-3 md:block md:p-4">
        <div className="mb-1 flex items-center gap-1.5">
          <Globe
            className="text-success h-3.5 w-3.5"
            aria-hidden={true}
          />
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            {t('dhcp.hero.wan')}
          </p>
        </div>
        <p className="text-foreground font-mono text-xl font-bold md:text-2xl">
          {boundClients}
          <span className="text-muted-foreground ml-1 text-sm font-normal">/{totalClients}</span>
        </p>
        <p
          className={`mt-1 text-xs ${boundClients === totalClients ? 'text-success' : 'text-warning'}`}
        >
          {boundClients === totalClients ? t('dhcp.hero.allConnected') : t('dhcp.hero.partial')}
        </p>
      </div>
    </div>
  );
});

DHCPStatusHero.displayName = 'DHCPStatusHero';
