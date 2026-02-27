/**
 * DHCP Tab Component
 * Epic 0.5: DHCP Management
 * Dashboard Pro style - displays DHCP overview, servers, pools, leases, and clients
 */

import React from 'react';

import { useTranslation } from 'react-i18next';

import { useDHCPServers, useDHCPLeases, useDHCPClients, useDHCPPools } from '@nasnet/api-client/queries';
import { useConnectionStore } from '@nasnet/state/stores';
import { DHCPClientCard, LeaseTable } from '@nasnet/ui/patterns';

import { DHCPStatusHero, DHCPPoolCard, DHCPServersSection } from './dhcp/components';

export const DHCPTab = React.memo(function DHCPTab() {
  const { t } = useTranslation('network');
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';

  const { data: servers, isLoading: isLoadingServers, error: serversError } = useDHCPServers(routerIp);
  const { data: pools, isLoading: isLoadingPools, error: poolsError } = useDHCPPools(routerIp);
  const { data: leases, isLoading: isLoadingLeases, error: leasesError } = useDHCPLeases(routerIp);
  const { data: clients, isLoading: isLoadingClients, error: clientsError } = useDHCPClients(routerIp);

  const isLoadingHero = isLoadingServers || isLoadingPools || isLoadingLeases || isLoadingClients;

  return (
    <div className="px-page-mobile md:px-page-tablet lg:px-page-desktop py-page-mobile md:py-page-tablet space-y-6 max-w-7xl mx-auto animate-fade-in-up">
      {/* DHCP Status Hero - Stats Grid */}
      <DHCPStatusHero
        servers={servers || []}
        leases={leases || []}
        pools={pools || []}
        clients={clients || []}
        isLoading={isLoadingHero}
      />

      {/* Address Pools Section */}
      <div className="space-y-component-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold font-display text-foreground category-header category-header-dhcp">{t('dhcp.pools')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('dhcp.poolsDescription')}
              {pools && pools.length > 0 && ` · ${pools.length} ${pools.length > 1 ? t('dhcp.poolsPlural') : t('dhcp.poolSingular')}`}
            </p>
          </div>
        </div>

        {isLoadingPools ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-component-md">
            {[1, 2].map((i) => (
              <div key={i} className="bg-card rounded-card-sm border border-border p-component-md animate-pulse">
                <div className="flex items-center gap-component-sm mb-component-sm">
                  <div className="w-8 h-8 bg-muted rounded-lg" />
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-24 mb-component-xs" />
                    <div className="h-3 bg-muted rounded w-16" />
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full mb-component-sm" />
                <div className="grid grid-cols-3 gap-component-xs">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-12 bg-muted rounded-lg" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : poolsError ? (
          <div className="bg-error/10 border border-error rounded-card-sm p-component-md">
            <p className="text-sm text-error">
              {t('dhcp.poolsLoadError')}: {poolsError.message}
            </p>
          </div>
        ) : pools && pools.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-component-md">
            {pools.map((pool) => (
              <DHCPPoolCard key={pool.id} pool={pool} leases={leases || []} />
            ))}
          </div>
        ) : (
          <div className="bg-muted rounded-card-sm border border-border p-component-lg text-center">
            <p className="text-muted-foreground text-sm">
              {t('dhcp.noPools')}
            </p>
          </div>
        )}
      </div>

      {/* DHCP Servers Section */}
      <div className="space-y-component-sm">
        <div>
          <h2 className="text-lg font-semibold font-display text-foreground">{t('dhcp.servers')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('dhcp.serversDescription')}
            {servers && servers.length > 0 && ` · ${servers.filter(s => !s.disabled).length} ${t('dhcp.active')}`}
          </p>
        </div>

        {serversError ? (
          <div className="bg-error/10 border border-error rounded-card-sm p-component-md">
            <p className="text-sm text-error">
              {t('dhcp.serversLoadError')}: {serversError.message}
            </p>
          </div>
        ) : (
          <DHCPServersSection
            servers={servers || []}
            pools={pools || []}
            isLoading={isLoadingServers}
          />
        )}
      </div>

      {/* Active Leases Section */}
      <div className="space-y-component-sm">
        <div>
          <h2 className="text-lg font-semibold font-display text-foreground">{t('dhcp.leases')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('dhcp.leasesDescription')}
            {leases && leases.length > 0 && ` · ${leases.length} ${leases.length > 1 ? t('dhcp.leasesPlural') : t('dhcp.leaseSingular')}`}
          </p>
        </div>

        {isLoadingLeases ? (
          <div className="bg-card rounded-card-sm border border-border p-component-lg animate-pulse">
            <div className="space-y-component-sm">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-8 bg-muted rounded" />
              ))}
            </div>
          </div>
        ) : leasesError ? (
          <div className="bg-error/10 border border-error rounded-card-sm p-component-md">
            <p className="text-sm text-error">
              {t('dhcp.leasesLoadError')}: {leasesError.message}
            </p>
          </div>
        ) : (
          <LeaseTable leases={leases || []} />
        )}
      </div>

      {/* DHCP Clients Section (WAN) */}
      <div className="space-y-component-sm">
        <div>
          <h2 className="text-lg font-semibold font-display text-foreground">{t('dhcp.wanClients')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('dhcp.wanClientsDescription')}
            {clients && clients.length > 0 && ` · ${clients.filter(c => c.status === 'bound').length} ${t('dhcp.connected')}`}
          </p>
        </div>

        {isLoadingClients ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-component-md">
            <div className="bg-card rounded-card-sm border border-border p-component-md animate-pulse">
              <div className="flex items-center gap-component-sm mb-component-sm">
                <div className="w-10 h-10 bg-muted rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-32 mb-component-xs" />
                  <div className="h-3 bg-muted rounded w-24" />
                </div>
              </div>
            </div>
          </div>
        ) : clientsError ? (
          <div className="bg-error/10 border border-error rounded-card-sm p-component-md">
            <p className="text-sm text-error">
              {t('dhcp.clientsLoadError')}: {clientsError.message}
            </p>
          </div>
        ) : clients && clients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-component-md">
            {clients.map((client) => (
              <DHCPClientCard key={client.id} client={client} />
            ))}
          </div>
        ) : (
          <div className="bg-muted rounded-card-sm border border-border p-component-lg text-center">
            <p className="text-muted-foreground text-sm">
              {t('dhcp.noClients')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

DHCPTab.displayName = 'DHCPTab';
