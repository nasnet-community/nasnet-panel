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
      <div className="px-page-mobile md:px-page-tablet lg:px-page-desktop mx-auto max-w-7xl py-4 md:py-6">
        <LoadingSkeleton />
      </div>
    );
  }

  if (interfacesError) {
    return (
      <div className="px-page-mobile md:px-page-tablet lg:px-page-desktop mx-auto max-w-7xl py-4 md:py-6">
        <div className="bg-error/10 border-error/30 rounded-card-sm border p-6 text-center">
          <h3 className="text-error mb-2 text-lg font-semibold">{t('errors.loadFailed')}</h3>
          <p className="text-error/80 mb-4 text-sm">{interfacesError.message}</p>
          <button
            onClick={handleRefresh}
            className="bg-error/10 text-error hover:bg-error/20 rounded-md px-4 py-2 text-sm font-medium transition-colors"
          >
            {t('buttons.tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-page-mobile md:px-page-tablet lg:px-page-desktop animate-fade-in-up mx-auto max-w-7xl space-y-6 py-4 md:py-6">
      {/* Page Header with Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-foreground font-display text-2xl font-semibold">{t('title')}</h1>
          <p className="text-muted-foreground text-sm">{t('description')}</p>
        </div>
        <WifiQuickActions
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />
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
