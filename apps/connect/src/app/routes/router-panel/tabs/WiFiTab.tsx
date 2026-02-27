/**
 * WiFi Tab Component
 * Epic 0.3: WiFi Management
 * Dashboard Pro style layout with status hero, interface list, clients table, and security summary
 */

import React from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { useWirelessInterfaces, useWirelessClients } from '@nasnet/api-client/queries';
import { useConnectionStore } from '@nasnet/state/stores';

import {
  WifiStatusHero,
  WifiInterfaceList,
  ConnectedClientsTable,
  WifiQuickActions,
  WifiSecuritySummary,
  LoadingSkeleton,
} from '../../../pages/wifi/components';

export const WiFiTab = React.memo(function WiFiTab() {
  const { t } = useTranslation('wifi');
  const { id: routerId } = useParams({ from: '/router/$id/wifi/' });
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
      <div className="px-page-mobile md:px-page-tablet lg:px-page-desktop py-4 md:py-6 max-w-7xl mx-auto">
        <LoadingSkeleton />
      </div>
    );
  }

  if (interfacesError) {
    return (
      <div className="px-page-mobile md:px-page-tablet lg:px-page-desktop py-4 md:py-6 max-w-7xl mx-auto">
        <div className="bg-error/10 border border-error/30 rounded-card-sm p-6 text-center">
          <h3 className="text-lg font-semibold text-error mb-2">
            {t('errors.loadFailed')}
          </h3>
          <p className="text-sm text-error/80 mb-4">
            {interfacesError.message}
          </p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-error/10 text-error rounded-md text-sm font-medium hover:bg-error/20 transition-colors"
          >
            {t('buttons.tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-page-mobile md:px-page-tablet lg:px-page-desktop py-4 md:py-6 space-y-6 max-w-7xl mx-auto animate-fade-in-up">
      {/* Page Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground font-display">
            {t('title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('description')}
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

      {/* Wireless Interfaces List */}
      <WifiInterfaceList routerId={routerId} />
    </div>
  );
});

WiFiTab.displayName = 'WiFiTab';
