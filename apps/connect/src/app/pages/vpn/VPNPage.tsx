/**
 * VPN Page Component
 * Displays VPN configuration status including WireGuard interfaces
 * Implements FR0-19: Users can view list of WireGuard interfaces with status
 * Implements FR0-21: Real-time connection status with auto-refresh
 */

import * as React from 'react';

import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  useWireGuardInterfaces,
  useL2TPInterfaces,
  usePPTPInterfaces,
  useSSTPInterfaces,
} from '@nasnet/api-client/queries';
import type { WireGuardInterface, L2TPInterface, PPTPInterface, SSSTPInterface } from '@nasnet/core/types';
import { useConnectionStore } from '@nasnet/state/stores';
import { WireGuardCard, VPNTypeSection, GenericVPNCard } from '@nasnet/ui/patterns';
import { Skeleton, Button } from '@nasnet/ui/primitives';

/**
 * Main VPN viewing page
 * - Displays all WireGuard interfaces
 * - Shows interface status, listening port, public key
 * - Provides peer count and copy public key functionality
 * - Auto-refreshes every 5 seconds for real-time status
 * - Manual refresh button for on-demand updates
 *
 * @example
 * Route: /vpn
 */
export const VPNPage = React.memo(function VPNPage() {
  const { t } = useTranslation('vpn');
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';

  // Parallel queries for all VPN types
  const { data: wireguardInterfaces, isLoading: isLoadingWG, isError: isErrorWG, refetch: refetchWG, isFetching: isFetchingWG } = useWireGuardInterfaces(routerIp);
  const { data: l2tpInterfaces, isLoading: isLoadingL2TP } = useL2TPInterfaces(routerIp);
  const { data: pptpInterfaces, isLoading: isLoadingPPTP } = usePPTPInterfaces(routerIp);
  const { data: sstpInterfaces, isLoading: isLoadingSSTP } = useSSTPInterfaces(routerIp);

  // Combined loading and error states
  const isLoading = isLoadingWG || isLoadingL2TP || isLoadingPPTP || isLoadingSSTP;
  const isError = isErrorWG; // Only WireGuard errors are critical for now
  const refetch = refetchWG; // Manual refresh only refetches WireGuard
  const isFetching = isFetchingWG;

  return (
    <div className="px-page-mobile md:px-page-tablet lg:px-page-desktop py-component-lg">
      <div className="max-w-6xl mx-auto space-y-component-lg">
        {/* Page header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-1">
              {t('title')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('overview')}{' '}
              <span className="text-xs opacity-70">{t('status.autoRefresh')}</span>
            </p>
          </div>
          {/* Manual Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading || isFetching}
            className="flex items-center gap-component-sm min-h-[44px] min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={t('button.refresh', { ns: 'common' })}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} aria-hidden="true" />
            {t('button.refresh', { ns: 'common' })}
          </Button>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-component-md" role="status" aria-label="Loading VPN interfaces">
            <Skeleton className="h-48 w-full rounded-card-sm" />
            <Skeleton className="h-48 w-full rounded-card-sm" />
            <Skeleton className="h-48 w-full rounded-card-sm" />
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="bg-error/10 border-2 border-error rounded-card-sm p-component-lg shadow-sm" role="alert">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <svg
                  className="w-6 h-6 text-error"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t('status.failedToLoad')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('status.failedMessage')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && wireguardInterfaces && wireguardInterfaces.length === 0 && (
          <div className="bg-card border border-border rounded-card-sm p-component-lg text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-2xl flex items-center justify-center">
              <svg
                className="w-8 h-8 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {t('status.noWireGuardConfigured')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('status.noWireGuardMessage')}
            </p>
          </div>
        )}

        {/* WireGuard Interface list */}
        {!isLoading && !isError && wireguardInterfaces && wireguardInterfaces.length > 0 && (
          <div className="space-y-component-md">
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
          <div className="space-y-component-md">
            <h2 className="text-xl font-semibold text-foreground">
              {t('servers.otherVPNTypes')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('servers.otherVPNTypesDescription')}
            </p>

            {/* L2TP Section */}
            <VPNTypeSection
              type="L2TP"
              count={l2tpInterfaces?.length || 0}
              defaultExpanded={false}
            >
              {l2tpInterfaces && l2tpInterfaces.length > 0 ? (
                <div className="space-y-component-sm">
                  {l2tpInterfaces.map((iface: L2TPInterface) => (
                    <GenericVPNCard key={iface.id} vpnInterface={iface} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('status.noL2TPConfigured')}
                </p>
              )}
            </VPNTypeSection>

            {/* PPTP Section */}
            <VPNTypeSection
              type="PPTP"
              count={pptpInterfaces?.length || 0}
              defaultExpanded={false}
            >
              {pptpInterfaces && pptpInterfaces.length > 0 ? (
                <div className="space-y-component-sm">
                  {pptpInterfaces.map((iface: PPTPInterface) => (
                    <GenericVPNCard key={iface.id} vpnInterface={iface} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('status.noPPTPConfigured')}
                </p>
              )}
            </VPNTypeSection>

            {/* SSTP Section */}
            <VPNTypeSection
              type="SSTP"
              count={sstpInterfaces?.length || 0}
              defaultExpanded={false}
            >
              {sstpInterfaces && sstpInterfaces.length > 0 ? (
                <div className="space-y-component-sm">
                  {sstpInterfaces.map((iface: SSSTPInterface) => (
                    <GenericVPNCard key={iface.id} vpnInterface={iface} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('status.noSSTPConfigured')}
                </p>
              )}
            </VPNTypeSection>
          </div>
        )}
      </div>
    </div>
  );
});

VPNPage.displayName = 'VPNPage';
