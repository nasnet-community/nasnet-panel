/**
 * DHCP Servers Section Component
 * Compact server list with key metrics and status
 */

import React from 'react';

import { Network, Clock, Server } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  return pools.find((p) => p.name === server.addressPool);
}

export const DHCPServersSection = React.memo(function DHCPServersSection({
  servers,
  pools,
  isLoading = false,
  className = '',
}: DHCPServersSectionProps) {
  const { t } = useTranslation('network');
  if (isLoading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-card rounded-card-sm border-border animate-pulse border p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="bg-muted h-10 w-10 rounded-lg" />
              <div className="flex-1">
                <div className="bg-muted mb-2 h-4 w-32 rounded" />
                <div className="bg-muted h-3 w-24 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (servers.length === 0) {
    return (
      <div
        className={`bg-muted rounded-card-sm border-border border p-8 text-center shadow-sm ${className}`}
      >
        <Server
          className="text-muted-foreground mx-auto mb-3 h-12 w-12"
          aria-hidden={true}
        />
        <p className="text-muted-foreground text-sm">{t('dhcp.noServers')}</p>
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
            className={`bg-card rounded-card-sm border-border border p-4 shadow-sm transition-all ${
              !isActive ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              {/* Left: Icon and Name */}
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    isActive ? 'bg-info/10' : 'bg-muted'
                  }`}
                >
                  <Network
                    className={`h-5 w-5 ${isActive ? 'text-info' : 'text-muted-foreground'}`}
                    aria-hidden={true}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-foreground font-display text-sm font-semibold">
                      {server.name}
                    </h3>
                    {server.authoritative && (
                      <span className="bg-info/10 text-info rounded px-1.5 py-0.5 text-[10px] font-medium">
                        {t('dhcp.auth')}
                      </span>
                    )}
                    {!isActive && (
                      <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-medium">
                        {t('dhcp.disabled')}
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {t('dhcp.interface')}: <span className="font-mono">{server.interface}</span>
                  </p>
                </div>
              </div>

              {/* Right: Quick Stats */}
              <div className="flex items-center gap-4 text-right">
                <div>
                  <div className="flex items-center justify-end gap-1">
                    <Clock
                      className="text-muted-foreground h-3 w-3"
                      aria-hidden={true}
                    />
                    <p className="text-muted-foreground text-xs">{t('dhcp.lease')}</p>
                  </div>
                  <p className="text-foreground font-mono text-sm font-semibold">
                    {formatLeaseTime(server.leaseTime)}
                  </p>
                </div>
                {pool && (
                  <div className="hidden sm:block">
                    <p className="text-muted-foreground text-xs">{t('dhcp.pool')}</p>
                    <p className="text-foreground max-w-[120px] truncate font-mono text-sm">
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
});

DHCPServersSection.displayName = 'DHCPServersSection';
