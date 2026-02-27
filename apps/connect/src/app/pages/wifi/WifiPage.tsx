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
  const routerId = useConnectionStore((state) => state.currentRouterId) || '';
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
      <div className="px-page-mobile md:px-page-tablet lg:px-page-desktop py-page-mobile md:py-page-tablet lg:py-page-desktop mx-auto max-w-7xl">
        <LoadingSkeleton />
      </div>
    );
  }

  if (interfacesError) {
    return (
      <div className="px-page-mobile md:px-page-tablet lg:px-page-desktop py-page-mobile md:py-page-tablet lg:py-page-desktop mx-auto max-w-7xl">
        <div
          className="bg-error/10 border-error/30 p-component-lg rounded-[var(--semantic-radius-card)] border text-center"
          role="alert"
        >
          <h3 className="text-error mb-2 text-lg font-semibold">{t('status.failedToLoad')}</h3>
          <p className="text-error/80 mb-4 text-sm">{interfacesError.message}</p>
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
    <div className="px-page-mobile md:px-page-tablet lg:px-page-desktop py-page-mobile md:py-page-tablet lg:py-page-desktop space-y-component-lg animate-fade-in-up mx-auto max-w-7xl">
      {/* Page Header with Quick Actions */}
      <div className="gap-component-md flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-foreground category-header category-header-wifi text-2xl font-semibold">
            {t('title')}
          </h1>
          <p className="text-muted-foreground text-sm">{t('overview')}</p>
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

      {/* Wireless Interfaces List */}
      <WifiInterfaceList routerId={routerId} />

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
