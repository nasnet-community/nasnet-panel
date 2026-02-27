/**
 * Network Dashboard
 * Simplified layout with 4 sections:
 * 1. Interfaces Overview
 * 2. Connected Devices
 * 3. IP Addresses
 * 4. DHCP Pool Status
 */

import * as React from 'react';

import { Network, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  useInterfaces,
  useARPTable,
  useIPAddresses,
  useDHCPServers,
  useDHCPLeases,
  useDHCPPools,
} from '@nasnet/api-client/queries';
import { useConnectionStore } from '@nasnet/state/stores';

import { ConnectedDevicesCard } from './components/ConnectedDevicesCard';
import { DHCPPoolSummary } from './components/DHCPPoolSummary';
import { ErrorDisplay } from './components/ErrorDisplay';
import { InterfaceGridCard } from './components/InterfaceGridCard';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import { QuickIPOverview } from './components/QuickIPOverview';

export const NetworkDashboard = React.memo(function NetworkDashboard() {
  const { t } = useTranslation('common');
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';

  // Fetch network data
  const {
    data: interfaces,
    isLoading: isLoadingInterfaces,
    error: interfacesError,
  } = useInterfaces(routerIp);

  const { data: arpEntries, isLoading: isLoadingARP, error: arpError } = useARPTable(routerIp);

  const { ipAddresses, loading: isLoadingIPs, error: ipError } = useIPAddresses(routerIp);

  // Fetch DHCP data
  const { data: dhcpServers, isLoading: isLoadingDHCPServers } = useDHCPServers(routerIp);
  const { data: dhcpLeases, isLoading: isLoadingDHCPLeases } = useDHCPLeases(routerIp);
  const {
    data: dhcpPools,
    isLoading: isLoadingDHCPPools,
    error: dhcpError,
  } = useDHCPPools(routerIp);

  const isLoadingDHCP = isLoadingDHCPServers || isLoadingDHCPLeases || isLoadingDHCPPools;

  // Calculate interface stats - count running interfaces with any link
  const activeInterfaces = interfaces?.filter((i) => i.status === 'running') || [];
  const linkUpInterfaces = activeInterfaces.filter((i) => i.linkStatus === 'up' || !i.linkStatus);

  // Show loading state
  if (isLoadingInterfaces) {
    return (
      <div
        className="bg-background min-h-screen"
        role="status"
        aria-label="Loading network dashboard"
      >
        <LoadingSkeleton />
      </div>
    );
  }

  // Show error state
  if (interfacesError) {
    return (
      <div
        className="bg-background min-h-screen p-4"
        role="alert"
      >
        <ErrorDisplay error={interfacesError} />
      </div>
    );
  }

  return (
    <div className="bg-background animate-fade-in-up min-h-screen">
      <div className="px-page-mobile md:px-page-tablet lg:px-page-desktop mx-auto max-w-7xl space-y-4 py-4">
        {/* Section 1: DHCP Pool Status */}
        <DHCPPoolSummary
          servers={dhcpServers || []}
          leases={dhcpLeases || []}
          pools={dhcpPools || []}
          isLoading={isLoadingDHCP}
          error={dhcpError}
        />

        {/* Section 2: Interfaces Overview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Network
                className="text-muted-foreground h-4 w-4"
                aria-hidden="true"
              />
              <h2 className="text-foreground font-display text-sm font-semibold">
                {t('network.interfaces')}
              </h2>
              <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
                {linkUpInterfaces.length}/{interfaces?.length || 0}
              </span>
            </div>
            <button
              className="text-primary hover:text-primary/80 focus-visible:ring-ring flex min-h-[44px] min-w-[44px] items-center gap-0.5 rounded text-xs font-medium focus-visible:ring-2 focus-visible:ring-offset-2"
              aria-label={t('button.viewAll')}
            >
              {t('button.viewAll')}
              <ChevronRight
                className="h-3 w-3"
                aria-hidden="true"
              />
            </button>
          </div>

          <div className="gap-component-sm md:gap-component-md grid md:grid-cols-2 lg:grid-cols-3">
            {(interfaces || []).slice(0, 6).map((iface) => (
              <InterfaceGridCard
                key={iface.id}
                interface={iface}
              />
            ))}
          </div>

          {(!interfaces || interfaces.length === 0) && (
            <div className="bg-card rounded-card-sm border-border border p-8 text-center">
              <p className="text-muted-foreground">{t('network.noInterfacesFound')}</p>
            </div>
          )}
        </div>

        {/* Section 3 & 4: Two Column Layout - Devices and IPs */}
        <div className="gap-component-md grid lg:grid-cols-2">
          <ConnectedDevicesCard
            entries={arpEntries || []}
            isLoading={isLoadingARP}
            error={arpError}
          />

          <QuickIPOverview
            ipAddresses={ipAddresses || []}
            isLoading={isLoadingIPs}
            error={ipError}
          />
        </div>
      </div>
    </div>
  );
});
NetworkDashboard.displayName = 'NetworkDashboard';
