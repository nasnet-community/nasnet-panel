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
const PROTOCOL_ORDER: VPNProtocol[] = ['wireguard', 'openvpn', 'l2tp', 'pptp', 'sstp', 'ikev2'];

/**
 * VPN Dashboard Component
 */
export const VPNDashboard = React.memo(function VPNDashboard() {
  const { t } = useTranslation('vpn');
  const navigate = useNavigate();
  const { id: routerId } = useParams({ from: '/router/$id/vpn/' });
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';

  const { data: stats, isLoading, isError, refetch, isFetching } = useVPNStats(routerIp);

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
      navigate({
        to: `/router/${routerId}/vpn/servers` as string,
        search: { protocol } as Record<string, unknown>,
      });
    }
  };

  return (
    <div className="px-page-mobile md:px-page-tablet lg:px-page-desktop py-component-lg animate-fade-in-up">
      <div className="space-y-component-lg mx-auto max-w-6xl">
        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-foreground mb-1 text-2xl font-bold sm:text-3xl">
              {t('title')}
            </h1>
            <p className="text-muted-foreground text-sm">{t('overview')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading || isFetching}
              className="gap-component-sm focus-visible:ring-ring flex min-h-[44px] min-w-[44px] items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              aria-label={t('button.refresh', { ns: 'common' })}
            >
              <RefreshCw
                className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span className="hidden sm:inline">{t('button.refresh', { ns: 'common' })}</span>
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div
            className="space-y-component-lg"
            role="status"
            aria-label="Loading VPN dashboard"
          >
            <Skeleton className="rounded-card-sm h-48 w-full" />
            <div className="gap-component-md grid grid-cols-1 md:grid-cols-2">
              <Skeleton className="rounded-card-sm h-36" />
              <Skeleton className="rounded-card-sm h-36" />
            </div>
            <div className="gap-component-md grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton
                  key={i}
                  className="rounded-card-sm h-32"
                />
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div
            className="bg-error/10 border-error rounded-card-sm p-component-lg border-2"
            role="alert"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <svg
                  className="text-error h-6 w-6"
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
                <h3 className="text-foreground mb-2 text-lg font-semibold">
                  {t('status.failedToLoadStats')}
                </h3>
                <p className="text-muted-foreground mb-4 text-sm">{t('status.failedMessage')}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                >
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
            <div className="gap-component-md grid grid-cols-1 md:grid-cols-2">
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
              <h2 className="font-display text-foreground mb-4 text-lg font-semibold">
                {t('servers.protocols')}
              </h2>
              <div className="gap-component-md grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {PROTOCOL_ORDER.map((protocol) => {
                  const protocolStats = stats.protocolStats.find((p) => p.protocol === protocol);
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
                <h2 className="font-display text-foreground mb-4 text-lg font-semibold">
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
            <div className="gap-component-sm pt-component-md border-border flex flex-wrap border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleNavigateServers}
                className="gap-component-sm focus-visible:ring-ring flex min-h-[44px] items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                <Settings
                  className="h-4 w-4"
                  aria-hidden="true"
                />
                {t('servers.configureServers')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNavigateClients}
                className="gap-component-sm focus-visible:ring-ring flex min-h-[44px] items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                <Settings
                  className="h-4 w-4"
                  aria-hidden="true"
                />
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
