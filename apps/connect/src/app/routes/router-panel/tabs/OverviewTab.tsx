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

import React from 'react';

import { useNavigate } from '@tanstack/react-router';
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
import { useTranslation } from 'react-i18next';

import {
  useRouterInfo,
  useRouterResource,
  useRouterboard,
  useDHCPLeases,
  useDHCPServers,
  useDHCPPools,
  useVPNStats,
  usePPPActive,
} from '@nasnet/api-client/queries';
import { calculateStatus, formatBytes, parseRouterOSUptime } from '@nasnet/core/utils';
import { useConnectionStore } from '@nasnet/state/stores';
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
import type {
  QuickAction,
  StatusPill,
  ConnectedVPNClient,
  NetworkStatus,
} from '@nasnet/ui/patterns';

export const OverviewTab = React.memo(function OverviewTab() {
  const { t } = useTranslation('router');
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
  const { data: _vpnStats, isLoading: vpnLoading } = useVPNStats(routerIp);
  const { data: pppActive } = usePPPActive(routerIp);

  // Calculate CPU status
  const cpuStatus = resourceData?.cpuLoad ? calculateStatus(resourceData.cpuLoad) : 'healthy';

  // Calculate memory usage
  const memoryUsed = resourceData ? resourceData.totalMemory - resourceData.freeMemory : 0;
  const memoryPercentage = resourceData ? (memoryUsed / resourceData.totalMemory) * 100 : 0;
  const memoryStatus = calculateStatus(memoryPercentage);
  const memorySubtitle =
    resourceData ?
      `${formatBytes(memoryUsed)} / ${formatBytes(resourceData.totalMemory)}`
    : undefined;

  // Calculate disk usage
  const diskUsed = resourceData ? resourceData.totalHddSpace - resourceData.freeHddSpace : 0;
  const diskPercentage = resourceData ? (diskUsed / resourceData.totalHddSpace) * 100 : 0;
  const diskStatus = calculateStatus(diskPercentage);
  const diskSubtitle =
    resourceData ?
      `${formatBytes(diskUsed)} / ${formatBytes(resourceData.totalHddSpace)}`
    : undefined;

  // Determine overall network status
  const getNetworkStatus = (): NetworkStatus => {
    if (isLoading || resourceLoading) return 'loading';
    if (error || resourceError) return 'error';
    if (cpuStatus === 'critical' || memoryStatus === 'critical' || diskStatus === 'critical')
      return 'error';
    if (cpuStatus === 'warning' || memoryStatus === 'warning' || diskStatus === 'warning')
      return 'warning';
    return 'healthy';
  };

  const networkStatus = getNetworkStatus();
  const statusMessage =
    networkStatus === 'healthy' ? t('overview.statusHealthy')
    : networkStatus === 'warning' ? t('overview.statusWarning')
    : networkStatus === 'error' ? t('overview.statusError')
    : t('overview.statusLoading');

  // Get uptime in a friendly format
  const uptimeFormatted = data?.uptime ? parseRouterOSUptime(data.uptime) : 'N/A';

  // Get VPN connected clients count
  const vpnConnectedCount = pppActive?.length || 0;

  // Get active DHCP leases count
  const activeDhcpLeases =
    dhcpLeases?.filter((l) => l.status === 'bound' || !l.status)?.length || 0;

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
      label:
        vpnConnectedCount > 0 ?
          t('overview.quickActions.vpnActive')
        : t('overview.quickActions.vpnConnect'),
      sublabel:
        vpnConnectedCount > 0 ?
          t('overview.quickActions.vpnConnected', { count: vpnConnectedCount })
        : t('overview.quickActions.vpnManage'),
      onClick: () => navigate({ to: 'vpn' as '/' }),
      variant: vpnConnectedCount > 0 ? 'primary' : 'default',
    },
    {
      id: 'wifi',
      icon: Wifi,
      label: t('overview.quickActions.wifi'),
      sublabel: t('overview.quickActions.wifiManage'),
      onClick: () => navigate({ to: 'wifi' as '/' }),
    },
    {
      id: 'restart',
      icon: RotateCcw,
      label: t('overview.quickActions.restart'),
      sublabel: t('overview.quickActions.restartSafe'),
      onClick: () => {
        // TODO: Implement restart confirmation dialog
        console.log('Restart clicked');
      },
    },
    {
      id: 'firewall',
      icon: ShieldCheck,
      label: t('overview.quickActions.firewall'),
      sublabel: t('overview.quickActions.firewallActive'),
      onClick: () => navigate({ to: 'firewall' as '/' }),
    },
  ];

  // Status pills configuration
  const statusPills: StatusPill[] = [
    {
      id: 'internet',
      label: t('overview.statusPills.internetOk'),
      variant:
        networkStatus === 'healthy' ? 'success'
        : networkStatus === 'warning' ? 'warning'
        : 'error',
    },
    {
      id: 'vpn',
      label:
        vpnConnectedCount > 0 ?
          t('overview.statusPills.vpn', { count: vpnConnectedCount })
        : t('overview.statusPills.vpnOff'),
      variant: vpnConnectedCount > 0 ? 'success' : 'neutral',
    },
    {
      id: 'uptime',
      label: uptimeFormatted,
      variant: 'neutral',
    },
    {
      id: 'dhcp',
      label: t('overview.statusPills.devices', { count: activeDhcpLeases }),
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
        return <CheckCircle className="text-foreground h-16 w-16" />;
      case 'warning':
        return <AlertTriangle className="text-foreground h-16 w-16" />;
      case 'error':
        return <XCircle className="text-foreground h-16 w-16" />;
      case 'loading':
        return <Loader2 className="text-foreground h-16 w-16 animate-spin" />;
    }
  };

  const getHeroGradient = () => {
    switch (networkStatus) {
      case 'healthy':
        return 'from-primary to-primary';
      case 'warning':
        return 'from-warning to-warning';
      case 'error':
        return 'from-error to-error';
      case 'loading':
        return 'from-muted to-muted';
    }
  };

  return (
    <div className="min-h-full">
      {/* Hero Section with Status */}
      <div
        className={`bg-gradient-to-r ${getHeroGradient()} px-page-mobile md:px-page-tablet lg:px-page-desktop rounded-card-lg pb-28 pt-6 md:pb-32`}
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-white/70">{t('overview.routerStatus')}</p>
            <LastUpdated
              timestamp={dataUpdatedAt}
              className="text-white/70"
            />
          </div>
          <div className="py-4 text-center">
            <div className="mb-4 flex justify-center">{getStatusIcon()}</div>
            <h1 className="font-display text-3xl font-bold text-white md:text-4xl">
              {statusMessage}
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-page-mobile md:px-page-tablet lg:px-page-desktop -mt-20">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Quick Actions Card (Floating) */}
          <QuickActionsCard
            actions={quickActions}
            title={t('overview.quickActionsTitle')}
          />

          {/* Status Pills */}
          <StatusPills pills={statusPills} />

          {/* Resource Monitor Section */}
          <div>
            <h2 className="font-display mb-component-md px-component-sm text-lg font-semibold">
              {t('overview.resourceMonitor')}
            </h2>
            <div className="gap-component-md grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
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
            <h2 className="font-display mb-component-md px-component-sm text-lg font-semibold">
              {t('overview.networkActivity')}
            </h2>
            <div className="gap-component-md grid grid-cols-1 md:grid-cols-2">
              {/* DHCP Summary */}
              <DHCPSummaryCard
                activeLeases={activeDhcpLeases}
                ipRange={dhcpPoolRange}
                serverName={dhcpServers?.[0]?.name || t('overview.defaultDhcpServer')}
                isLoading={dhcpLeasesLoading}
                linkTo="dhcp"
              />

              {/* Traffic Chart */}
              <TrafficChart
                title={t('overview.networkTraffic')}
                showPlaceholder={true}
                height={140}
              />
            </div>
          </div>

          {/* VPN Clients Section */}
          <div>
            <h2 className="font-display mb-component-md px-component-sm text-lg font-semibold">
              {t('overview.vpnStatus')}
            </h2>
            <VPNClientsSummary
              connectedCount={vpnConnectedCount}
              clients={connectedVpnClients}
              isLoading={vpnLoading}
              linkTo="vpn"
              maxVisible={3}
            />
          </div>

          {/* Hardware Details Section */}
          <div className="pb-component-lg">
            <h2 className="font-display mb-component-md px-component-sm text-lg font-semibold">
              {t('overview.hardware')}
            </h2>
            <div className="gap-component-md grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
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
});

OverviewTab.displayName = 'OverviewTab';
