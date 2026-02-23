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
  return pools.find(p => p.name === server.addressPool);
}

export const DHCPServersSection = React.memo(function DHCPServersSection({
  servers,
  pools,
  isLoading = false,
  className = ''
}: DHCPServersSectionProps) {
  const { t } = useTranslation('network');
  if (isLoading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-card rounded-xl border border-border p-4 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted rounded-lg" />
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-32 mb-2" />
                <div className="h-3 bg-muted rounded w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (servers.length === 0) {
    return (
      <div className={`bg-muted rounded-xl border border-border p-8 text-center ${className}`}>
        <Server className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">
          {t('dhcp.noServers')}
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
            className={`bg-card rounded-xl border border-border p-4 transition-all ${
              !isActive ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              {/* Left: Icon and Name */}
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isActive
                    ? 'bg-info/10'
                    : 'bg-muted'
                }`}>
                  <Network className={`w-5 h-5 ${isActive ? 'text-info' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground text-sm">
                      {server.name}
                    </h3>
                    {server.authoritative && (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-info/10 text-info rounded">
                        {t('dhcp.auth')}
                      </span>
                    )}
                    {!isActive && (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground rounded">
                        {t('dhcp.disabled')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('dhcp.interface')}: {server.interface}
                  </p>
                </div>
              </div>

              {/* Right: Quick Stats */}
              <div className="flex items-center gap-4 text-right">
                <div>
                  <div className="flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{t('dhcp.lease')}</p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {formatLeaseTime(server.leaseTime)}
                  </p>
                </div>
                {pool && (
                  <div className="hidden sm:block">
                    <p className="text-xs text-muted-foreground">{t('dhcp.pool')}</p>
                    <p className="text-sm font-mono text-foreground truncate max-w-[120px]">
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
















