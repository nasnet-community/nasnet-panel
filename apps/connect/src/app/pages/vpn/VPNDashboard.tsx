/**
 * VPN Dashboard Page
 * Main VPN overview showing stats, health status, and navigation to server/client pages
 * Based on UX Design Direction 2: Card-Heavy Dashboard
 */

import * as React from 'react';

import { useNavigate, useParams } from '@tanstack/react-router';
import { RefreshCw, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useVPNStats } from '@nasnet/api-client/queries';
import type { VPNProtocol } from '@nasnet/core/types';
import { useConnectionStore } from '@nasnet/state/stores';
import {
  VPNStatusHero,
  VPNProtocolStatsCard,
  VPNNavigationCard,
  VPNIssuesList,
} from '@nasnet/ui/patterns';
import { Button, Skeleton } from '@nasnet/ui/primitives';

/**
 * Protocol display order
 */
const PROTOCOL_ORDER: VPNProtocol[] = [
  'wireguard',
  'openvpn',
  'l2tp',
  'pptp',
  'sstp',
  'ikev2',
];

/**
 * VPN Dashboard Component
 */
export const VPNDashboard = React.memo(function VPNDashboard() {
  const { t } = useTranslation('vpn');
  const navigate = useNavigate();
  const { id: routerId } = useParams({ from: '/router/$id/vpn/' });
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';
  
  const { 
    data: stats, 
    isLoading, 
    isError, 
    refetch, 
    isFetching 
  } = useVPNStats(routerIp);

  // Navigate to server/client pages within router context
  const handleNavigateServers = () => {
    if (routerId) {
      navigate({ to: `/router/${routerId}/vpn/servers` });
    }
  };

  const handleNavigateClients = () => {
    if (routerId) {
      navigate({ to: `/router/${routerId}/vpn/clients` });
    }
  };

  // Navigate to specific protocol
  const handleProtocolClick = (protocol: VPNProtocol) => {
    // Navigate to servers page with protocol filter
    if (routerId) {
      navigate({ to: `/router/${routerId}/vpn/servers` as string, search: { protocol } as Record<string, unknown> });
    }
  };

  return (
    <div className="px-page-mobile md:px-page-tablet lg:px-page-desktop py-component-lg">
      <div className="max-w-6xl mx-auto space-y-component-lg">
        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
              {t('title')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('overview')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading || isFetching}
              className="flex items-center gap-component-sm min-h-[44px] min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label={t('button.refresh', { ns: 'common' })}
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span className="hidden sm:inline">{t('button.refresh', { ns: 'common' })}</span>
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-component-lg" role="status" aria-label="Loading VPN dashboard">
            <Skeleton className="h-48 w-full rounded-card-sm" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-component-md">
              <Skeleton className="h-36 rounded-card-sm" />
              <Skeleton className="h-36 rounded-card-sm" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-component-md">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-card-sm" />
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="bg-error/10 border-2 border-error rounded-card-sm p-component-lg" role="alert">
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
                  {t('status.failedToLoadStats')}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('status.failedMessage')}
                </p>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  {t('button.tryAgain', { ns: 'common' })}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        {!isLoading && !isError && stats && (
          <>
            {/* Status Hero */}
            <VPNStatusHero
              status={stats.overallHealth}
              totalServers={stats.totalServers}
              totalClients={stats.totalClients}
              activeServerConnections={stats.totalServerConnections}
              activeClientConnections={stats.totalClientConnections}
              totalRx={stats.totalRx}
              totalTx={stats.totalTx}
              issueCount={stats.issues.length}
            />

            {/* Navigation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-component-md">
              <VPNNavigationCard
                type="server"
                count={stats.totalServers}
                activeCount={stats.activeServers}
                onClick={handleNavigateServers}
              />
              <VPNNavigationCard
                type="client"
                count={stats.totalClients}
                activeCount={stats.activeClients}
                onClick={handleNavigateClients}
              />
            </div>

            {/* Protocol Stats Grid */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">
                {t('servers.protocols')}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-component-md">
                {PROTOCOL_ORDER.map((protocol) => {
                  const protocolStats = stats.protocolStats.find(
                    (p) => p.protocol === protocol
                  );
                  if (!protocolStats) return null;
                  
                  return (
                    <VPNProtocolStatsCard
                      key={protocol}
                      stats={protocolStats}
                      onClick={() => handleProtocolClick(protocol)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Issues Section */}
            {stats.issues.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  {t('servers.issuesAndAlerts')}
                </h2>
                <VPNIssuesList
                  issues={[...stats.issues]}
                  maxItems={5}
                  showSeeAll={stats.issues.length > 5}
                />
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-component-sm pt-component-md border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={handleNavigateServers}
                className="flex items-center gap-component-sm min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Settings className="h-4 w-4" aria-hidden="true" />
                {t('servers.configureServers')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNavigateClients}
                className="flex items-center gap-component-sm min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Settings className="h-4 w-4" aria-hidden="true" />
                {t('servers.configureClients')}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

VPNDashboard.displayName = 'VPNDashboard';

