/**
 * DHCP Tab Component
 * Epic 0.5: DHCP Management
 * Dashboard Pro style - displays DHCP overview, servers, pools, leases, and clients
 */

import React from 'react';

import { useTranslation } from 'react-i18next';

import {
  useDHCPServers,
  useDHCPLeases,
  useDHCPClients,
  useDHCPPools,
} from '@nasnet/api-client/queries';
import { useConnectionStore } from '@nasnet/state/stores';
import { DHCPClientCard, LeaseTable } from '@nasnet/ui/patterns';

import { DHCPStatusHero, DHCPPoolCard, DHCPServersSection } from './dhcp/components';

export const DHCPTab = React.memo(function DHCPTab() {
  const { t } = useTranslation('network');
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';

  const {
    data: servers,
    isLoading: isLoadingServers,
    error: serversError,
  } = useDHCPServers(routerIp);
  const { data: pools, isLoading: isLoadingPools, error: poolsError } = useDHCPPools(routerIp);
  const { data: leases, isLoading: isLoadingLeases, error: leasesError } = useDHCPLeases(routerIp);
  const {
    data: clients,
    isLoading: isLoadingClients,
    error: clientsError,
  } = useDHCPClients(routerIp);

  const isLoadingHero = isLoadingServers || isLoadingPools || isLoadingLeases || isLoadingClients;

  return (
    <div className="px-page-mobile md:px-page-tablet lg:px-page-desktop py-page-mobile md:py-page-tablet animate-fade-in-up mx-auto max-w-7xl space-y-6">
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
            <h2 className="font-display text-foreground category-header category-header-dhcp text-lg font-semibold">
              {t('dhcp.pools')}
            </h2>
            <p className="text-muted-foreground text-sm">
              {t('dhcp.poolsDescription')}
              {pools &&
                pools.length > 0 &&
                ` · ${pools.length} ${pools.length > 1 ? t('dhcp.poolsPlural') : t('dhcp.poolSingular')}`}
            </p>
          </div>
        </div>

        {isLoadingPools ?
          <div className="gap-component-md grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-card rounded-card-sm border-border p-component-md animate-pulse border"
              >
                <div className="gap-component-sm mb-component-sm flex items-center">
                  <div className="bg-muted h-8 w-8 rounded-lg" />
                  <div className="flex-1">
                    <div className="bg-muted mb-component-xs h-4 w-24 rounded" />
                    <div className="bg-muted h-3 w-16 rounded" />
                  </div>
                </div>
                <div className="bg-muted mb-component-sm h-2 rounded-full" />
                <div className="gap-component-xs grid grid-cols-3">
                  {[1, 2, 3].map((j) => (
                    <div
                      key={j}
                      className="bg-muted h-12 rounded-lg"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        : poolsError ?
          <div className="bg-error/10 border-error rounded-card-sm p-component-md border">
            <p className="text-error text-sm">
              {t('dhcp.poolsLoadError')}: {poolsError.message}
            </p>
          </div>
        : pools && pools.length > 0 ?
          <div className="gap-component-md grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {pools.map((pool) => (
              <DHCPPoolCard
                key={pool.id}
                pool={pool}
                leases={leases || []}
              />
            ))}
          </div>
        : <div className="bg-muted rounded-card-sm border-border p-component-lg border text-center">
            <p className="text-muted-foreground text-sm">{t('dhcp.noPools')}</p>
          </div>
        }
      </div>

      {/* DHCP Servers Section */}
      <div className="space-y-component-sm">
        <div>
          <h2 className="font-display text-foreground text-lg font-semibold">
            {t('dhcp.servers')}
          </h2>
          <p className="text-muted-foreground text-sm">
            {t('dhcp.serversDescription')}
            {servers &&
              servers.length > 0 &&
              ` · ${servers.filter((s) => !s.disabled).length} ${t('dhcp.active')}`}
          </p>
        </div>

        {serversError ?
          <div className="bg-error/10 border-error rounded-card-sm p-component-md border">
            <p className="text-error text-sm">
              {t('dhcp.serversLoadError')}: {serversError.message}
            </p>
          </div>
        : <DHCPServersSection
            servers={servers || []}
            pools={pools || []}
            isLoading={isLoadingServers}
          />
        }
      </div>

      {/* Active Leases Section */}
      <div className="space-y-component-sm">
        <div>
          <h2 className="font-display text-foreground text-lg font-semibold">{t('dhcp.leases')}</h2>
          <p className="text-muted-foreground text-sm">
            {t('dhcp.leasesDescription')}
            {leases &&
              leases.length > 0 &&
              ` · ${leases.length} ${leases.length > 1 ? t('dhcp.leasesPlural') : t('dhcp.leaseSingular')}`}
          </p>
        </div>

        {isLoadingLeases ?
          <div className="bg-card rounded-card-sm border-border p-component-lg animate-pulse border">
            <div className="space-y-component-sm">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="bg-muted h-8 rounded"
                />
              ))}
            </div>
          </div>
        : leasesError ?
          <div className="bg-error/10 border-error rounded-card-sm p-component-md border">
            <p className="text-error text-sm">
              {t('dhcp.leasesLoadError')}: {leasesError.message}
            </p>
          </div>
        : <LeaseTable leases={leases || []} />}
      </div>

      {/* DHCP Clients Section (WAN) */}
      <div className="space-y-component-sm">
        <div>
          <h2 className="font-display text-foreground text-lg font-semibold">
            {t('dhcp.wanClients')}
          </h2>
          <p className="text-muted-foreground text-sm">
            {t('dhcp.wanClientsDescription')}
            {clients &&
              clients.length > 0 &&
              ` · ${clients.filter((c) => c.status === 'bound').length} ${t('dhcp.connected')}`}
          </p>
        </div>

        {isLoadingClients ?
          <div className="gap-component-md grid grid-cols-1 md:grid-cols-2">
            <div className="bg-card rounded-card-sm border-border p-component-md animate-pulse border">
              <div className="gap-component-sm mb-component-sm flex items-center">
                <div className="bg-muted h-10 w-10 rounded-lg" />
                <div className="flex-1">
                  <div className="bg-muted mb-component-xs h-4 w-32 rounded" />
                  <div className="bg-muted h-3 w-24 rounded" />
                </div>
              </div>
            </div>
          </div>
        : clientsError ?
          <div className="bg-error/10 border-error rounded-card-sm p-component-md border">
            <p className="text-error text-sm">
              {t('dhcp.clientsLoadError')}: {clientsError.message}
            </p>
          </div>
        : clients && clients.length > 0 ?
          <div className="gap-component-md grid grid-cols-1 md:grid-cols-2">
            {clients.map((client) => (
              <DHCPClientCard
                key={client.id}
                client={client}
              />
            ))}
          </div>
        : <div className="bg-muted rounded-card-sm border-border p-component-lg border text-center">
            <p className="text-muted-foreground text-sm">{t('dhcp.noClients')}</p>
          </div>
        }
      </div>
    </div>
  );
});

DHCPTab.displayName = 'DHCPTab';
