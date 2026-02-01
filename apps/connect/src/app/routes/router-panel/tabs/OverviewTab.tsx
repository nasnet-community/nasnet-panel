/**
 * Overview Tab Component
 * Epic 0.2: Dashboard Overview
 * Redesigned with Action-First design direction (Direction 4)
 * 
 * Features:
 * - Golden amber hero header with prominent status
 * - Quick Actions card with 2x2 action grid
 * - Status pills for quick-glance information
 * - Resource monitoring with gauges
 * - DHCP summary and traffic visualization
 * - VPN clients summary with expandable list
 */

import { useNavigate } from '@tanstack/react-router';
import {
  SystemInfoCard,
  ResourceGauge,
  HardwareCard,
  LastUpdated,
  QuickActionsCard,
  DHCPSummaryCard,
  TrafficChart,
  VPNClientsSummary,
  StatusPills,
} from '@nasnet/ui/patterns';
import type { QuickAction, StatusPill, ConnectedVPNClient } from '@nasnet/ui/patterns';
import { useRouterInfo, useRouterResource, useRouterboard } from '@nasnet/api-client/queries';
import { useDHCPLeases, useDHCPServers, useDHCPPools } from '@nasnet/api-client/queries';
import { useVPNStats, usePPPActive } from '@nasnet/api-client/queries';
import { calculateStatus, formatBytes, parseRouterOSUptime } from '@nasnet/core/utils';
import { useConnectionStore } from '@nasnet/state/stores';
import { 
  Shield, 
  Wifi, 
  RotateCcw, 
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
} from 'lucide-react';
import type { NetworkStatus } from '@nasnet/ui/patterns';

export function OverviewTab() {
  const navigate = useNavigate();
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';

  // Fetch router information
  const { data, isLoading, error, refetch } = useRouterInfo(routerIp);

  // Fetch router resource data (CPU, Memory, Disk)
  const {
    data: resourceData,
    isLoading: resourceLoading,
    error: resourceError,
    dataUpdatedAt,
  } = useRouterResource(routerIp);

  // Fetch hardware information
  const {
    data: hardwareData,
    isLoading: hardwareLoading,
    error: hardwareError,
  } = useRouterboard(routerIp);

  // Fetch DHCP data
  const { data: dhcpLeases, isLoading: dhcpLeasesLoading } = useDHCPLeases(routerIp);
  const { data: dhcpServers } = useDHCPServers(routerIp);
  const { data: dhcpPools } = useDHCPPools(routerIp);

  // Fetch VPN stats
  const { data: vpnStats, isLoading: vpnLoading } = useVPNStats(routerIp);
  const { data: pppActive } = usePPPActive(routerIp);

  // Calculate CPU status
  const cpuStatus = resourceData?.cpuLoad
    ? calculateStatus(resourceData.cpuLoad)
    : 'healthy';

  // Calculate memory usage
  const memoryUsed = resourceData
    ? resourceData.totalMemory - resourceData.freeMemory
    : 0;
  const memoryPercentage = resourceData
    ? (memoryUsed / resourceData.totalMemory) * 100
    : 0;
  const memoryStatus = calculateStatus(memoryPercentage);
  const memorySubtitle = resourceData
    ? `${formatBytes(memoryUsed)} / ${formatBytes(resourceData.totalMemory)}`
    : undefined;

  // Calculate disk usage
  const diskUsed = resourceData
    ? resourceData.totalHddSpace - resourceData.freeHddSpace
    : 0;
  const diskPercentage = resourceData
    ? (diskUsed / resourceData.totalHddSpace) * 100
    : 0;
  const diskStatus = calculateStatus(diskPercentage);
  const diskSubtitle = resourceData
    ? `${formatBytes(diskUsed)} / ${formatBytes(resourceData.totalHddSpace)}`
    : undefined;

  // Determine overall network status
  const getNetworkStatus = (): NetworkStatus => {
    if (isLoading || resourceLoading) return 'loading';
    if (error || resourceError) return 'error';
    if (cpuStatus === 'critical' || memoryStatus === 'critical' || diskStatus === 'critical') return 'error';
    if (cpuStatus === 'warning' || memoryStatus === 'warning' || diskStatus === 'warning') return 'warning';
    return 'healthy';
  };

  const networkStatus = getNetworkStatus();
  const statusMessage =
    networkStatus === 'healthy'
      ? 'All Good ✓'
      : networkStatus === 'warning'
      ? 'Attention Needed'
      : networkStatus === 'error'
      ? 'System Issues'
      : 'Loading...';

  // Get uptime in a friendly format
  const uptimeFormatted = data?.uptime ? parseRouterOSUptime(data.uptime) : 'N/A';

  // Get VPN connected clients count
  const vpnConnectedCount = pppActive?.length || 0;
  const vpnActiveClients = vpnStats?.activeClients || 0;

  // Get active DHCP leases count
  const activeDhcpLeases = dhcpLeases?.filter(l => l.status === 'bound' || !l.status)?.length || 0;

  // Get DHCP pool range for display
  // Note: RouterOS API returns ranges as a string, but type says array
  const getDhcpPoolRange = () => {
    if (!dhcpPools || dhcpPools.length === 0) return 'N/A';
    const ranges = dhcpPools[0].ranges;
    if (!ranges) return 'N/A';
    // Handle both string and array cases
    if (Array.isArray(ranges)) {
      return ranges.join(', ');
    }
    return String(ranges);
  };
  const dhcpPoolRange = getDhcpPoolRange();

  // Quick Actions configuration
  const quickActions: QuickAction[] = [
    {
      id: 'vpn',
      icon: Shield,
      label: vpnConnectedCount > 0 ? 'VPN Active' : 'Connect VPN',
      sublabel: vpnConnectedCount > 0 ? `${vpnConnectedCount} connected` : 'Manage connections',
      onClick: () => navigate({ to: 'vpn' as '/' }),
      variant: vpnConnectedCount > 0 ? 'primary' : 'default',
    },
    {
      id: 'wifi',
      icon: Wifi,
      label: 'WiFi',
      sublabel: 'Manage networks',
      onClick: () => navigate({ to: 'wifi' as '/' }),
    },
    {
      id: 'restart',
      icon: RotateCcw,
      label: 'Restart',
      sublabel: 'Safe restart',
      onClick: () => {
        // TODO: Implement restart confirmation dialog
        console.log('Restart clicked');
      },
    },
    {
      id: 'firewall',
      icon: ShieldCheck,
      label: 'Firewall',
      sublabel: 'Active',
      onClick: () => navigate({ to: 'firewall' as '/' }),
    },
  ];

  // Status pills configuration
  const statusPills: StatusPill[] = [
    {
      id: 'internet',
      label: 'Internet OK',
      variant: networkStatus === 'healthy' ? 'success' : networkStatus === 'warning' ? 'warning' : 'error',
    },
    {
      id: 'vpn',
      label: vpnConnectedCount > 0 ? `VPN (${vpnConnectedCount})` : 'VPN Off',
      variant: vpnConnectedCount > 0 ? 'success' : 'neutral',
    },
    {
      id: 'uptime',
      label: uptimeFormatted,
      variant: 'neutral',
    },
    {
      id: 'dhcp',
      label: `${activeDhcpLeases} Devices`,
      variant: 'info',
    },
  ];

  // Map PPP active connections to VPN client summary format
  const connectedVpnClients: ConnectedVPNClient[] = (pppActive || []).slice(0, 5).map((conn) => ({
    id: conn.id,
    name: conn.name || 'Unknown',
    protocol: conn.service as ConnectedVPNClient['protocol'],
    localAddress: conn.address,
    uptime: conn.uptime,
  }));

  // Get status icon and colors for hero section
  const getStatusIcon = () => {
    switch (networkStatus) {
      case 'healthy':
        return <CheckCircle className="w-16 h-16 text-white" />;
      case 'warning':
        return <AlertTriangle className="w-16 h-16 text-white" />;
      case 'error':
        return <XCircle className="w-16 h-16 text-white" />;
      case 'loading':
        return <Loader2 className="w-16 h-16 text-white animate-spin" />;
    }
  };

  const getHeroGradient = () => {
    switch (networkStatus) {
      case 'healthy':
        return 'from-primary-500 to-primary-400';
      case 'warning':
        return 'from-warning to-warning-dark';
      case 'error':
        return 'from-error to-error-dark';
      case 'loading':
        return 'from-slate-500 to-slate-400';
    }
  };

  return (
    <div className="min-h-full">
      {/* Hero Section with Status */}
      <div className={`bg-gradient-to-r ${getHeroGradient()} px-4 pt-6 pb-28 md:px-6 md:pb-32 rounded-b-[40px]`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <p className="text-white/70 text-sm">Router Status</p>
            <LastUpdated timestamp={dataUpdatedAt} className="text-white/70" />
          </div>
          <div className="text-center py-4">
            <div className="flex justify-center mb-4">
              {getStatusIcon()}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              {statusMessage}
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 md:px-6 -mt-20">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Quick Actions Card (Floating) */}
          <QuickActionsCard 
            actions={quickActions}
            title="Quick Actions"
          />

          {/* Status Pills */}
          <StatusPills pills={statusPills} />

          {/* Resource Monitor Section */}
          <div>
            <h2 className="text-lg font-semibold mb-4 px-2">Resource Monitor</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* System Information Card */}
              <SystemInfoCard
                data={data}
                isLoading={isLoading}
                error={error}
                onRetry={() => refetch()}
              />

              {/* CPU Usage Gauge */}
              <ResourceGauge
                label="CPU"
                value={resourceData?.cpuLoad}
                status={cpuStatus}
                isLoading={resourceLoading}
              />

              {/* Memory Usage Gauge */}
              <ResourceGauge
                label="Memory"
                value={memoryPercentage}
                status={memoryStatus}
                subtitle={memorySubtitle}
                isLoading={resourceLoading}
              />

              {/* Disk Usage Gauge */}
              <ResourceGauge
                label="Disk"
                value={diskPercentage}
                status={diskStatus}
                subtitle={diskSubtitle}
                isLoading={resourceLoading}
              />
            </div>
          </div>

          {/* DHCP & Traffic Section */}
          <div>
            <h2 className="text-lg font-semibold mb-4 px-2">Network Activity</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* DHCP Summary */}
              <DHCPSummaryCard
                activeLeases={activeDhcpLeases}
                ipRange={dhcpPoolRange}
                serverName={dhcpServers?.[0]?.name || 'DHCP Server'}
                isLoading={dhcpLeasesLoading}
                linkTo="dhcp"
              />

              {/* Traffic Chart */}
              <TrafficChart
                title="Network Traffic"
                showPlaceholder={true}
                height={140}
              />
            </div>
          </div>

          {/* VPN Clients Section */}
          <div>
            <h2 className="text-lg font-semibold mb-4 px-2">VPN Status</h2>
            <VPNClientsSummary
              connectedCount={vpnConnectedCount}
              clients={connectedVpnClients}
              isLoading={vpnLoading}
              linkTo="vpn"
              maxVisible={3}
            />
          </div>

          {/* Hardware Details Section */}
          <div className="pb-6">
            <h2 className="text-lg font-semibold mb-4 px-2">Hardware</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <HardwareCard
                data={hardwareData}
                isLoading={hardwareLoading}
                error={hardwareError}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
