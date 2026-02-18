/**
 * WiFi Dashboard Page
 * Dashboard Pro style layout with status hero, interface list, clients table, and security summary
 * Implements FR0-14: Users can view list of wireless interfaces with status
 */

import { useQueryClient } from '@tanstack/react-query';

import { useWirelessInterfaces, useWirelessClients } from '@nasnet/api-client/queries';
import { useConnectionStore } from '@nasnet/state/stores';

import {
  WifiStatusHero,
  WifiInterfaceList,
  ConnectedClientsTable,
  WifiQuickActions,
  WifiSecuritySummary,
  LoadingSkeleton,
} from './components';

/**
 * Main WiFi management dashboard
 * - Displays WiFi status hero with key metrics
 * - Shows all wireless interfaces with controls
 * - Lists connected clients with signal info
 * - Shows security status per interface
 */
export function WifiPage() {
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';
  const queryClient = useQueryClient();

  const {
    data: interfaces,
    isLoading: isLoadingInterfaces,
    error: interfacesError,
    isFetching: isFetchingInterfaces,
  } = useWirelessInterfaces(routerIp);

  const {
    data: clients,
    isLoading: isLoadingClients,
    isFetching: isFetchingClients,
  } = useWirelessClients(routerIp);

  const isLoading = isLoadingInterfaces || isLoadingClients;
  const isRefreshing = isFetchingInterfaces || isFetchingClients;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['wireless'] });
  };

  if (isLoading) {
    return (
      <div className="px-4 py-4 md:px-6 md:py-6 max-w-7xl mx-auto">
        <LoadingSkeleton />
      </div>
    );
  }

  if (interfacesError) {
    return (
      <div className="px-4 py-4 md:px-6 md:py-6 max-w-7xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">
            Failed to load WiFi data
          </h3>
          <p className="text-sm text-red-600 dark:text-red-300 mb-4">
            {interfacesError.message}
          </p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 md:px-6 md:py-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            WiFi Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Monitor and manage your wireless networks
          </p>
        </div>
        <WifiQuickActions onRefresh={handleRefresh} isRefreshing={isRefreshing} />
      </div>

      {/* WiFi Status Hero - Stats Grid */}
      <WifiStatusHero
        interfaces={interfaces || []}
        clients={clients || []}
        isLoading={isLoading}
      />

      {/* Wireless Interfaces List */}
      <WifiInterfaceList routerId="" />

      {/* Connected Clients Table */}
      <ConnectedClientsTable
        clients={clients || []}
        isLoading={isLoadingClients}
      />

      {/* Security Summary */}
      <WifiSecuritySummary
        interfaces={interfaces || []}
        isLoading={isLoadingInterfaces}
      />
    </div>
  );
}
