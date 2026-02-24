/**
 * Dashboard Page
 * Main dashboard view showing router overview and system information
 * Redesigned with StatusCard, VPNCardEnhanced, and QuickActionButton
 */

import { useNavigate } from '@tanstack/react-router';
import { Wifi, Network, Shield, Settings, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useRouterInfo, useRouterResource, useRouterboard } from '@nasnet/api-client/queries';
import { calculateStatus, formatBytes, parseRouterOSUptime } from '@nasnet/core/utils';
import { useConnectionStore } from '@nasnet/state/stores';
import {
  SystemInfoCard,
  ResourceGauge,
  HardwareCard,
  LastUpdated,
  StatusCard,
  VPNCardEnhanced,
  QuickActionButton,
} from '@nasnet/ui/patterns';

/**
 * DashboardPage Component
 * Displays system information and resource monitoring for connected router
 */
export function DashboardPage() {
  const { t } = useTranslation('dashboard');
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
  const getNetworkStatus = () => {
    if (isLoading || resourceLoading) return 'loading';
    if (error || resourceError) return 'error';
    if (cpuStatus === 'critical' || memoryStatus === 'critical' || diskStatus === 'critical') return 'error';
    if (cpuStatus === 'warning' || memoryStatus === 'warning' || diskStatus === 'warning') return 'warning';
    return 'healthy';
  };

  const networkStatus = getNetworkStatus();
  const statusMessage =
    networkStatus === 'healthy'
      ? t('routerHealth.allOnline')
      : networkStatus === 'warning'
      ? t('routerHealth.attentionNeeded')
      : networkStatus === 'error'
      ? t('routerHealth.issuesDetected')
      : t('common.loading');

  // Get device count (placeholder - would come from actual API)
  const deviceCount = 12; // TODO: Get from actual connected devices API

  // Get uptime in a friendly format
  const uptimeFormatted = data?.uptime ? parseRouterOSUptime(data.uptime) : 'N/A';

  // Status card metrics
  const statusMetrics = [
    { value: deviceCount, label: t('quickActions.devices') },
    { value: resourceData?.cpuLoad ? Math.round(100 - resourceData.cpuLoad) : '--', label: t('quickActions.available'), unit: '%' },
    { value: uptimeFormatted, label: t('quickActions.uptime') },
  ];

  // VPN status (placeholder - would integrate with actual VPN state)
  const handleVPNToggle = (enabled: boolean) => {
    console.log('VPN toggle:', enabled);
    // TODO: Integrate with actual VPN control
  };

  return (
    <div className="px-page-mobile md:px-page-tablet lg:px-page-desktop py-6 space-y-6">
      {/* Hero Status Card - Clean Minimal Design */}
      <StatusCard
        status={networkStatus}
        message={statusMessage}
        subtitle={t('overview.status')}
        metrics={statusMetrics}
      />

      {/* VPN Quick Toggle */}
      <VPNCardEnhanced
        status="disconnected"
        onToggle={handleVPNToggle}
        profile={{
          name: 'Mullvad',
          location: 'Amsterdam',
          flag: '🇳🇱',
        }}
      />

      {/* Quick Actions Grid */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-3">{t('quickActions.title')}</p>
        <div className="grid grid-cols-5 gap-component-md">
          <QuickActionButton
            icon={Wifi}
            label={t('quickActions.wifi')}
            onClick={() => navigate({ to: '/wifi' })}
          />
          <QuickActionButton
            icon={Network}
            label={t('quickActions.network')}
            onClick={() => navigate({ to: '/network' })}
          />
          <QuickActionButton
            icon={Shield}
            label={t('quickActions.firewall')}
            onClick={() => navigate({ to: '/firewall' as '/' })}
          />
          <QuickActionButton
            icon={Settings}
            label={t('quickActions.settings')}
            onClick={() => navigate({ to: '/settings' as '/' })}
          />
          <QuickActionButton
            icon={AlertCircle}
            label={t('quickActions.troubleshoot')}
            onClick={() => navigate({ to: '/dashboard/troubleshoot', search: { routerId: routerIp, autoStart: false } })}
          />
        </div>
      </div>

      {/* Resource Monitoring Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold font-display text-foreground">{t('resources.title')}</h2>
          <LastUpdated timestamp={dataUpdatedAt} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-component-md">
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

      {/* Hardware Details Section */}
      <div>
        <h2 className="text-lg font-semibold font-display text-foreground mb-4">{t('overview.hardware')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-component-md">
          <HardwareCard
            data={hardwareData}
            isLoading={hardwareLoading}
            error={hardwareError}
          />
        </div>
      </div>
    </div>
  );
}
DashboardPage.displayName = 'DashboardPage';
