/**
 * WiFi Dashboard Page
 * Dashboard Pro style layout with status hero, interface list, clients table, and security summary
 * Implements FR0-14: Users can view list of wireless interfaces with status
 */

import React from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { useWirelessInterfaces, useWirelessClients } from '@nasnet/api-client/queries';
import { useConnectionStore } from '@nasnet/state/stores';
import { Button } from '@nasnet/ui/primitives';

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
export const WifiPage = React.memo(function WifiPage() {
  const { t } = useTranslation('wifi');
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
      <div className="px-page-mobile md:px-page-tablet lg:px-page-desktop py-page-mobile md:py-page-tablet lg:py-page-desktop max-w-7xl mx-auto">
        <LoadingSkeleton />
      </div>
    );
  }

  if (interfacesError) {
    return (
      <div className="px-page-mobile md:px-page-tablet lg:px-page-desktop py-page-mobile md:py-page-tablet lg:py-page-desktop max-w-7xl mx-auto">
        <div className="bg-error/10 border border-error/30 rounded-[var(--semantic-radius-card)] p-component-lg text-center" role="alert">
          <h3 className="text-lg font-semibold text-error mb-2">
            {t('status.failedToLoad')}
          </h3>
          <p className="text-sm text-error/80 mb-4">
            {interfacesError.message}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="min-h-[44px]"
          >
            {t('button.tryAgain', { ns: 'common' })}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-page-mobile md:px-page-tablet lg:px-page-desktop py-page-mobile md:py-page-tablet lg:py-page-desktop space-y-component-lg max-w-7xl mx-auto">
      {/* Page Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-component-md">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {t('title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('overview')}
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
});

WifiPage.displayName = 'WifiPage';
