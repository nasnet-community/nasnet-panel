/**
 * DHCP Tab Component
 * Epic 0.5: DHCP Management
 * Dashboard Pro style - displays DHCP overview, servers, pools, leases, and clients
 */

import { useDHCPServers, useDHCPLeases, useDHCPClients, useDHCPPools } from '@nasnet/api-client/queries';
import { useConnectionStore } from '@nasnet/state/stores';
import { DHCPClientCard, LeaseTable } from '@nasnet/ui/patterns';

import { DHCPStatusHero, DHCPPoolCard, DHCPServersSection } from './dhcp/components';

export function DHCPTab() {
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';

  const { data: servers, isLoading: isLoadingServers, error: serversError } = useDHCPServers(routerIp);
  const { data: pools, isLoading: isLoadingPools, error: poolsError } = useDHCPPools(routerIp);
  const { data: leases, isLoading: isLoadingLeases, error: leasesError } = useDHCPLeases(routerIp);
  const { data: clients, isLoading: isLoadingClients, error: clientsError } = useDHCPClients(routerIp);

  const isLoadingHero = isLoadingServers || isLoadingPools || isLoadingLeases || isLoadingClients;

  return (
    <div className="px-4 py-4 md:px-6 md:py-6 space-y-6 max-w-7xl mx-auto">
      {/* DHCP Status Hero - Stats Grid */}
      <DHCPStatusHero
        servers={servers || []}
        leases={leases || []}
        pools={pools || []}
        clients={clients || []}
        isLoading={isLoadingHero}
      />

      {/* Address Pools Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Address Pools</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              IP address allocation pools
              {pools && pools.length > 0 && ` · ${pools.length} pool${pools.length > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {isLoadingPools ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24 mb-1" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16" />
                  </div>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full mb-3" />
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : poolsError ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <p className="text-sm text-red-700 dark:text-red-400">
              Failed to load address pools: {poolsError.message}
            </p>
          </div>
        ) : pools && pools.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pools.map((pool) => (
              <DHCPPoolCard key={pool.id} pool={pool} leases={leases || []} />
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              No address pools configured
            </p>
          </div>
        )}
      </div>

      {/* DHCP Servers Section */}
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">DHCP Servers</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Configured DHCP servers on your router
            {servers && servers.length > 0 && ` · ${servers.filter(s => !s.disabled).length} active`}
          </p>
        </div>

        {serversError ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <p className="text-sm text-red-700 dark:text-red-400">
              Failed to load DHCP servers: {serversError.message}
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
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Active Leases</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Current DHCP lease assignments
            {leases && leases.length > 0 && ` · ${leases.length} lease${leases.length > 1 ? 's' : ''}`}
          </p>
        </div>

        {isLoadingLeases ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 animate-pulse">
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-8 bg-slate-100 dark:bg-slate-800 rounded" />
              ))}
            </div>
          </div>
        ) : leasesError ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <p className="text-sm text-red-700 dark:text-red-400">
              Failed to load DHCP leases: {leasesError.message}
            </p>
          </div>
        ) : (
          <LeaseTable leases={leases || []} />
        )}
      </div>

      {/* DHCP Clients Section (WAN) */}
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">WAN DHCP Clients</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            DHCP client status on WAN interfaces
            {clients && clients.length > 0 && ` · ${clients.filter(c => c.status === 'bound').length} connected`}
          </p>
        </div>

        {isLoadingClients ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-2" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24" />
                </div>
              </div>
            </div>
          </div>
        ) : clientsError ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <p className="text-sm text-red-700 dark:text-red-400">
              Failed to load DHCP clients: {clientsError.message}
            </p>
          </div>
        ) : clients && clients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clients.map((client) => (
              <DHCPClientCard key={client.id} client={client} />
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              No DHCP clients configured
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
