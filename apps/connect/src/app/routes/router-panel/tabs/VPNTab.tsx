/**
 * VPN Tab Component
 * Epic 0.4: VPN Viewing
 * Displays VPN configuration status including WireGuard interfaces
 * Implements FR0-19: Users can view list of WireGuard interfaces with status
 * Implements FR0-21: Real-time connection status with auto-refresh
 */

import { RefreshCw } from 'lucide-react';

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

export function VPNTab() {
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
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Page header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              VPN Configuration
            </h1>
            <p className="text-muted-foreground">
              View your VPN setup and monitor interface status{' '}
              <span className="text-xs">(Auto-refreshes every 5s)</span>
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
            Refresh
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
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <svg
                className="w-6 h-6 text-red-600 dark:text-red-400"
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
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
                  Failed to load VPN interfaces
                </h3>
                <p className="text-red-700 dark:text-red-300 mt-1">
                  Unable to retrieve VPN configuration from the router. Please check your connection.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && Array.isArray(wireguardInterfaces) && wireguardInterfaces.length === 0 && (
          <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-8 text-center">
            <svg
              className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-600 mb-4"
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
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
              No WireGuard interfaces configured
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Your router doesn't have any WireGuard VPN interfaces set up yet.
            </p>
          </div>
        )}

        {/* WireGuard Interface list */}
        {!isLoading && !isError && Array.isArray(wireguardInterfaces) && wireguardInterfaces.length > 0 && (
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
            <h2 className="text-2xl font-bold">
              Other VPN Types
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Additional VPN protocols configured on your router
            </p>

            {/* L2TP Section */}
            <VPNTypeSection
              type="L2TP"
              count={l2tpInterfaces?.length || 0}
              defaultExpanded={false}
            >
              {l2tpInterfaces && l2tpInterfaces.length > 0 ? (
                <div className="space-y-3">
                  {l2tpInterfaces.map((iface: L2TPInterface) => (
                    <GenericVPNCard key={iface.id} vpnInterface={iface} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No L2TP interfaces configured
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
                <div className="space-y-3">
                  {pptpInterfaces.map((iface: PPTPInterface) => (
                    <GenericVPNCard key={iface.id} vpnInterface={iface} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No PPTP interfaces configured
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
                <div className="space-y-3">
                  {sstpInterfaces.map((iface: SSSTPInterface) => (
                    <GenericVPNCard key={iface.id} vpnInterface={iface} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No SSTP interfaces configured
                </p>
              )}
            </VPNTypeSection>
          </div>
        )}
      </div>
    </div>
  );
}
