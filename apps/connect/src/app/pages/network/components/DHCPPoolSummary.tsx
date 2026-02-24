/**
 * DHCP Pool Summary Component
 * Shows pool utilization, active leases, and available IPs
 */

import React, { useMemo } from 'react';

import { Server, Users, PieChart, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { DHCPServer, DHCPLease, DHCPPool } from '@nasnet/core/types';

import { cn } from '@nasnet/ui/utils';

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

export const DHCPPoolSummary = React.memo(function DHCPPoolSummary({ servers, leases, pools, isLoading, error }: DHCPPoolSummaryProps) {
  const { t } = useTranslation('network');
  const stats = useMemo(() => {
    const activeLeases = leases.filter(lease => lease.status === 'bound').length;
    const totalPoolSize = pools.reduce((acc, pool) => acc + calculatePoolSize(pool.ranges), 0);
    const availableIPs = Math.max(0, totalPoolSize - activeLeases);
    const utilizationPercent = totalPoolSize > 0 ? Math.round((activeLeases / totalPoolSize) * 100) : 0;
    const activeServers = servers.filter(s => !s.disabled).length;
    return { activeLeases, totalPoolSize, availableIPs, utilizationPercent, activeServers, totalServers: servers.length };
  }, [servers, leases, pools]);

  const getUtilizationColor = (percent: number) => {
    if (percent >= 90) return 'text-destructive';
    if (percent >= 70) return 'text-warning';
    return 'text-success';
  };

  const getUtilizationBarColor = (percent: number) => {
    if (percent >= 90) return 'bg-destructive';
    if (percent >= 70) return 'bg-warning';
    return 'bg-success';
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-4 animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-muted rounded-lg" />
          <div className="h-5 bg-muted rounded w-32" />
        </div>
        <div className="h-2 bg-muted rounded-full mb-4" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center">
              <div className="h-6 bg-muted rounded w-12 mx-auto mb-1" />
              <div className="h-3 bg-muted rounded w-16 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-2xl border border-destructive/30 p-4">
        <div className="flex items-center gap-2 text-destructive">
          <XCircle className="w-5 h-5" />
          <span className="text-sm font-medium">{t('dhcp.loadError')}</span>
        </div>
        <p className="text-xs text-destructive/70 mt-1">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-info/15 flex items-center justify-center">
            <Server className="w-4 h-4 text-info" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t('dhcp.poolStatus')}</h3>
            <p className="text-xs text-muted-foreground">{stats.activeServers}/{stats.totalServers} {t('dhcp.serversActive')}</p>
          </div>
        </div>
        <span className={cn('text-lg font-bold', getUtilizationColor(stats.utilizationPercent))}>{stats.utilizationPercent}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2 mb-4">
        <div className={cn('h-2 rounded-full transition-all duration-300', getUtilizationBarColor(stats.utilizationPercent))} style={{ width: `${Math.min(stats.utilizationPercent, 100)}%` } as React.CSSProperties} />
      </div>
      <div className="grid grid-cols-4 gap-2">
        <div className="text-center p-2 bg-muted rounded-card-sm">
          <Users className="w-3 h-3 text-info mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{stats.activeLeases}</p>
          <p className="text-xs text-muted-foreground">{t('dhcp.active')}</p>
        </div>
        <div className="text-center p-2 bg-muted rounded-card-sm">
          <PieChart className="w-3 h-3 text-success mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{stats.availableIPs}</p>
          <p className="text-xs text-muted-foreground">{t('dhcp.available')}</p>
        </div>
        <div className="text-center p-2 bg-muted rounded-card-sm">
          <p className="text-lg font-bold text-foreground">{stats.totalPoolSize}</p>
          <p className="text-xs text-muted-foreground">{t('dhcp.total')}</p>
        </div>
        <div className="text-center p-2 bg-muted rounded-card-sm">
          <p className="text-lg font-bold text-foreground">{pools.length}</p>
          <p className="text-xs text-muted-foreground">{t('dhcp.pools')}</p>
        </div>
      </div>
    </div>
  );
});

DHCPPoolSummary.displayName = 'DHCPPoolSummary';

























