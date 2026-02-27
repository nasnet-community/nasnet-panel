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

import { useInterfaces, useARPTable, useIPAddresses , useDHCPServers, useDHCPLeases, useDHCPPools } from '@nasnet/api-client/queries';
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

  const {
    data: arpEntries,
    isLoading: isLoadingARP,
    error: arpError,
  } = useARPTable(routerIp);

  const {
    ipAddresses,
    loading: isLoadingIPs,
    error: ipError,
  } = useIPAddresses(routerIp);

  // Fetch DHCP data
  const { data: dhcpServers, isLoading: isLoadingDHCPServers } = useDHCPServers(routerIp);
  const { data: dhcpLeases, isLoading: isLoadingDHCPLeases } = useDHCPLeases(routerIp);
  const { data: dhcpPools, isLoading: isLoadingDHCPPools, error: dhcpError } = useDHCPPools(routerIp);

  const isLoadingDHCP = isLoadingDHCPServers || isLoadingDHCPLeases || isLoadingDHCPPools;

  // Calculate interface stats - count running interfaces with any link
  const activeInterfaces = interfaces?.filter((i) => i.status === 'running') || [];
  const linkUpInterfaces = activeInterfaces.filter((i) =>
    i.linkStatus === 'up' || !i.linkStatus
  );

  // Show loading state
  if (isLoadingInterfaces) {
    return (
      <div className="min-h-screen bg-background" role="status" aria-label="Loading network dashboard">
        <LoadingSkeleton />
      </div>
    );
  }

  // Show error state
  if (interfacesError) {
    return (
      <div className="min-h-screen bg-background p-4" role="alert">
        <ErrorDisplay error={interfacesError} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background animate-fade-in-up">
      <div className="px-page-mobile md:px-page-tablet lg:px-page-desktop py-4 space-y-4 max-w-7xl mx-auto">

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
              <Network className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-foreground font-display">{t('network.interfaces')}</h2>
              <span className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full">
                {linkUpInterfaces.length}/{interfaces?.length || 0}
              </span>
            </div>
            <button
              className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-0.5 min-h-[44px] min-w-[44px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
              aria-label={t('button.viewAll')}
            >
              {t('button.viewAll')}
              <ChevronRight className="w-3 h-3" aria-hidden="true" />
            </button>
          </div>

          <div className="grid gap-component-sm md:gap-component-md md:grid-cols-2 lg:grid-cols-3">
            {(interfaces || []).slice(0, 6).map((iface) => (
              <InterfaceGridCard key={iface.id} interface={iface} />
            ))}
          </div>

          {(!interfaces || interfaces.length === 0) && (
            <div className="bg-card rounded-card-sm p-8 text-center border border-border">
              <p className="text-muted-foreground">{t('network.noInterfacesFound')}</p>
            </div>
          )}
        </div>

        {/* Section 3 & 4: Two Column Layout - Devices and IPs */}
        <div className="grid gap-component-md lg:grid-cols-2">
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
