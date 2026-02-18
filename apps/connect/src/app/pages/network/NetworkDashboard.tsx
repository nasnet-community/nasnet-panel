/**
 * Network Dashboard
 * Simplified layout with 4 sections:
 * 1. Interfaces Overview
 * 2. Connected Devices
 * 3. IP Addresses
 * 4. DHCP Pool Status
 */

import { Network, ChevronRight } from 'lucide-react';

import { useInterfaces, useARPTable, useIPAddresses , useDHCPServers, useDHCPLeases, useDHCPPools } from '@nasnet/api-client/queries';
import { useConnectionStore } from '@nasnet/state/stores';

import { ConnectedDevicesCard } from './components/ConnectedDevicesCard';
import { DHCPPoolSummary } from './components/DHCPPoolSummary';
import { ErrorDisplay } from './components/ErrorDisplay';
import { InterfaceGridCard } from './components/InterfaceGridCard';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import { QuickIPOverview } from './components/QuickIPOverview';

export function NetworkDashboard() {
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <LoadingSkeleton />
      </div>
    );
  }

  // Show error state
  if (interfacesError) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4">
        <ErrorDisplay error={interfacesError} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="px-4 py-4 md:px-6 md:py-6 space-y-4 max-w-7xl mx-auto">
        
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
              <Network className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Interfaces</h2>
              <span className="px-2 py-0.5 text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full">
                {linkUpInterfaces.length}/{interfaces?.length || 0}
              </span>
            </div>
            <button className="text-xs text-primary-500 hover:text-primary-600 font-medium flex items-center gap-0.5">
              View All
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          
          <div className="grid gap-2 md:gap-3 md:grid-cols-2 lg:grid-cols-3">
            {(interfaces || []).slice(0, 6).map((iface) => (
              <InterfaceGridCard key={iface.id} interface={iface} />
            ))}
          </div>
          
          {(!interfaces || interfaces.length === 0) && (
            <div className="bg-white dark:bg-slate-900 rounded-xl p-8 text-center border border-slate-200 dark:border-slate-800">
              <p className="text-slate-500 dark:text-slate-400">No interfaces found</p>
            </div>
          )}
        </div>

        {/* Section 3 & 4: Two Column Layout - Devices and IPs */}
        <div className="grid gap-4 lg:grid-cols-2">
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
}
