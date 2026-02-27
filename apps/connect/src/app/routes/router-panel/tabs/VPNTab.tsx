/**
 * VPN Tab Component
 * Epic 0.4: VPN Viewing
 * Displays VPN configuration status including WireGuard interfaces
 * Implements FR0-19: Users can view list of WireGuard interfaces with status
 * Implements FR0-21: Real-time connection status with auto-refresh
 */

import React from 'react';

import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  useWireGuardInterfaces,
  useL2TPInterfaces,
  usePPTPInterfaces,
  useSSTPInterfaces,
} from '@nasnet/api-client/queries';
import type {
  WireGuardInterface,
  L2TPInterface,
  PPTPInterface,
  SSSTPInterface,
} from '@nasnet/core/types';
import { useConnectionStore } from '@nasnet/state/stores';
import { WireGuardCard, VPNTypeSection, GenericVPNCard } from '@nasnet/ui/patterns';
import { Skeleton, Button } from '@nasnet/ui/primitives';

export const VPNTab = React.memo(function VPNTab() {
  const { t } = useTranslation('vpn');
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';

  // Parallel queries for all VPN types
  const {
    data: wireguardInterfaces,
    isLoading: isLoadingWG,
    isError: isErrorWG,
    refetch: refetchWG,
    isFetching: isFetchingWG,
  } = useWireGuardInterfaces(routerIp);
  const { data: l2tpInterfaces, isLoading: isLoadingL2TP } = useL2TPInterfaces(routerIp);
  const { data: pptpInterfaces, isLoading: isLoadingPPTP } = usePPTPInterfaces(routerIp);
  const { data: sstpInterfaces, isLoading: isLoadingSSTP } = useSSTPInterfaces(routerIp);

  // Combined loading and error states
  const isLoading = isLoadingWG || isLoadingL2TP || isLoadingPPTP || isLoadingSSTP;
  const isError = isErrorWG; // Only WireGuard errors are critical for now
  const refetch = refetchWG; // Manual refresh only refetches WireGuard
  const isFetching = isFetchingWG;

  return (
    <div className="px-page-mobile md:px-page-tablet lg:px-page-desktop animate-fade-in-up py-6">
      <div className="mx-auto max-w-6xl">
        {/* Page header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="font-display category-header category-header-vpn mb-2 text-3xl font-bold">
              {t('title')}
            </h1>
            <p className="text-muted-foreground">
              {t('description')} <span className="text-xs">({t('autoRefresh')})</span>
            </p>
          </div>
          {/* Manual Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading || isFetching}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            {t('buttons.refresh')}
          </Button>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="bg-error/10 border-error/30 rounded-lg border p-6">
            <div className="flex items-center gap-3">
              <svg
                className="text-error h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="text-error text-lg font-semibold">{t('errors.loadFailed')}</h3>
                <p className="text-error/80 mt-1">{t('errors.loadFailedDescription')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading &&
          !isError &&
          Array.isArray(wireguardInterfaces) &&
          wireguardInterfaces.length === 0 && (
            <div className="bg-muted border-border rounded-lg border p-8 text-center">
              <svg
                className="text-muted-foreground mx-auto mb-4 h-16 w-16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <h3 className="text-foreground mb-2 text-xl font-semibold">
                {t('states.noInterfaces')}
              </h3>
              <p className="text-muted-foreground">{t('states.noInterfacesDescription')}</p>
            </div>
          )}

        {/* WireGuard Interface list */}
        {!isLoading &&
          !isError &&
          Array.isArray(wireguardInterfaces) &&
          wireguardInterfaces.length > 0 && (
            <div className="space-y-4">
              {wireguardInterfaces.map((iface: WireGuardInterface) => (
                <WireGuardCard
                  key={iface.id}
                  interface={iface}
                />
              ))}
            </div>
          )}

        {/* Other VPN Types Section (Story 0-4-4) */}
        {!isLoading && !isError && (
          <div className="mt-8 space-y-4">
            <h2 className="font-display text-2xl font-bold">{t('otherVpnTypes.title')}</h2>
            <p className="text-muted-foreground mb-4 text-sm">{t('otherVpnTypes.description')}</p>

            {/* L2TP Section */}
            <VPNTypeSection
              type="L2TP"
              count={l2tpInterfaces?.length || 0}
              defaultExpanded={false}
            >
              {l2tpInterfaces && l2tpInterfaces.length > 0 ?
                <div className="space-y-3">
                  {l2tpInterfaces.map((iface: L2TPInterface) => (
                    <GenericVPNCard
                      key={iface.id}
                      vpnInterface={iface}
                    />
                  ))}
                </div>
              : <p className="text-muted-foreground py-4 text-center text-sm">
                  {t('otherVpnTypes.noL2TP')}
                </p>
              }
            </VPNTypeSection>

            {/* PPTP Section */}
            <VPNTypeSection
              type="PPTP"
              count={pptpInterfaces?.length || 0}
              defaultExpanded={false}
            >
              {pptpInterfaces && pptpInterfaces.length > 0 ?
                <div className="space-y-3">
                  {pptpInterfaces.map((iface: PPTPInterface) => (
                    <GenericVPNCard
                      key={iface.id}
                      vpnInterface={iface}
                    />
                  ))}
                </div>
              : <p className="text-muted-foreground py-4 text-center text-sm">
                  {t('otherVpnTypes.noPPTP')}
                </p>
              }
            </VPNTypeSection>

            {/* SSTP Section */}
            <VPNTypeSection
              type="SSTP"
              count={sstpInterfaces?.length || 0}
              defaultExpanded={false}
            >
              {sstpInterfaces && sstpInterfaces.length > 0 ?
                <div className="space-y-3">
                  {sstpInterfaces.map((iface: SSSTPInterface) => (
                    <GenericVPNCard
                      key={iface.id}
                      vpnInterface={iface}
                    />
                  ))}
                </div>
              : <p className="text-muted-foreground py-4 text-center text-sm">
                  {t('otherVpnTypes.noSSTP')}
                </p>
              }
            </VPNTypeSection>
          </div>
        )}
      </div>
    </div>
  );
});

VPNTab.displayName = 'VPNTab';
