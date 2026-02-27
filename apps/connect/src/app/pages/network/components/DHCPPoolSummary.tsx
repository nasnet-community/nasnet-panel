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
    const [start, end] = range.split('-').map((ip) => ip.trim());
    if (!end) {
      total += 1;
      continue;
    }
    const startOctets = start.split('.').map(Number);
    const endOctets = end.split('.').map(Number);
    const startNum =
      (startOctets[0] << 24) + (startOctets[1] << 16) + (startOctets[2] << 8) + startOctets[3];
    const endNum = (endOctets[0] << 24) + (endOctets[1] << 16) + (endOctets[2] << 8) + endOctets[3];
    total += endNum - startNum + 1;
  }
  return total;
}

export const DHCPPoolSummary = React.memo(function DHCPPoolSummary({
  servers,
  leases,
  pools,
  isLoading,
  error,
}: DHCPPoolSummaryProps) {
  const { t } = useTranslation('network');
  const stats = useMemo(() => {
    const activeLeases = leases.filter((lease) => lease.status === 'bound').length;
    const totalPoolSize = pools.reduce((acc, pool) => acc + calculatePoolSize(pool.ranges), 0);
    const availableIPs = Math.max(0, totalPoolSize - activeLeases);
    const utilizationPercent =
      totalPoolSize > 0 ? Math.round((activeLeases / totalPoolSize) * 100) : 0;
    const activeServers = servers.filter((s) => !s.disabled).length;
    return {
      activeLeases,
      totalPoolSize,
      availableIPs,
      utilizationPercent,
      activeServers,
      totalServers: servers.length,
    };
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
      <div className="bg-card border-border animate-pulse rounded-2xl border p-4">
        <div className="mb-4 flex items-center gap-2">
          <div className="bg-muted h-8 w-8 rounded-lg" />
          <div className="bg-muted h-5 w-32 rounded" />
        </div>
        <div className="bg-muted mb-4 h-2 rounded-full" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="text-center"
            >
              <div className="bg-muted mx-auto mb-1 h-6 w-12 rounded" />
              <div className="bg-muted mx-auto h-3 w-16 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card border-destructive/30 rounded-2xl border p-4">
        <div className="text-destructive flex items-center gap-2">
          <XCircle className="h-5 w-5" />
          <span className="text-sm font-medium">{t('dhcp.loadError')}</span>
        </div>
        <p className="text-destructive/70 mt-1 text-xs">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="bg-card border-border rounded-2xl border p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-category-dhcp/15 flex h-8 w-8 items-center justify-center rounded-lg">
            <Server className="text-category-dhcp h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-foreground text-sm font-semibold">
              {t('dhcp.poolStatus')}
            </h3>
            <p className="text-muted-foreground text-xs">
              {stats.activeServers}/{stats.totalServers} {t('dhcp.serversActive')}
            </p>
          </div>
        </div>
        <span
          className={cn(
            'font-mono text-lg font-bold',
            getUtilizationColor(stats.utilizationPercent)
          )}
        >
          {stats.utilizationPercent}%
        </span>
      </div>
      <div className="bg-muted mb-4 h-2 w-full rounded-full">
        <div
          className={cn(
            'h-2 rounded-full transition-all duration-300',
            getUtilizationBarColor(stats.utilizationPercent)
          )}
          style={{ width: `${Math.min(stats.utilizationPercent, 100)}%` } as React.CSSProperties}
        />
      </div>
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-muted rounded-card-sm border-border/50 border p-2 text-center">
          <Users className="text-category-dhcp mx-auto mb-1 h-3 w-3" />
          <p className="text-foreground font-mono text-lg font-bold">{stats.activeLeases}</p>
          <p className="text-muted-foreground text-xs">{t('dhcp.active')}</p>
        </div>
        <div className="bg-muted rounded-card-sm border-border/50 border p-2 text-center">
          <PieChart className="text-success mx-auto mb-1 h-3 w-3" />
          <p className="text-foreground font-mono text-lg font-bold">{stats.availableIPs}</p>
          <p className="text-muted-foreground text-xs">{t('dhcp.available')}</p>
        </div>
        <div className="bg-muted rounded-card-sm border-border/50 border p-2 text-center">
          <p className="text-foreground font-mono text-lg font-bold">{stats.totalPoolSize}</p>
          <p className="text-muted-foreground text-xs">{t('dhcp.total')}</p>
        </div>
        <div className="bg-muted rounded-card-sm border-border/50 border p-2 text-center">
          <p className="text-foreground font-mono text-lg font-bold">{pools.length}</p>
          <p className="text-muted-foreground text-xs">{t('dhcp.pools')}</p>
        </div>
      </div>
    </div>
  );
});

DHCPPoolSummary.displayName = 'DHCPPoolSummary';
