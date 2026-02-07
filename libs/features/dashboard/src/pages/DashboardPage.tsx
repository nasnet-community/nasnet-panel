/**
 * DashboardPage Component
 * Epic 5 - Story 5.1: Dashboard Layout with Router Health Summary
 *
 * Main dashboard page showing router health summaries and key metrics.
 * This is the default landing page after login.
 *
 * Features:
 * - Router health summary cards
 * - Real-time updates via GraphQL subscriptions
 * - Responsive grid layout (1/2/3 columns)
 * - Offline/cached data handling
 * - Manual refresh capability
 *
 * @see Story 4.1: TanStack Router Setup
 */

import { useState } from 'react';

import { CachedDataBadge } from '../components/cached-data-badge';
import { DashboardLayout } from '../components/dashboard-layout';
import { RecentLogs } from '../components/RecentLogs';
import { ResourceGauges } from '../components/ResourceGauges';
import { RouterHealthSummaryCard } from '../components/router-health-summary-card';

// TODO (Task 7): Replace with actual router list from context/store
const MOCK_ROUTER_IDS = ['router-uuid-1', 'router-uuid-2', 'router-uuid-3'];

/**
 * DashboardPage - Main dashboard view
 *
 * Displays health summaries for all configured routers.
 * Auto-refreshes via subscriptions with polling fallback.
 */
export function DashboardPage() {
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Handle manual refresh
  const handleRefresh = () => {
    setLastRefresh(new Date());
    // TODO: Trigger refetch on all router health queries
  };

  return (
    <div className="h-full flex flex-col">
      {/* Offline Banner (shown when all routers offline/stale) */}
      {/* TODO: Implement offline detection logic */}

      {/* Dashboard Layout with Router Health Cards */}
      <DashboardLayout onRefresh={handleRefresh} showRefresh={true}>
        {MOCK_ROUTER_IDS.map((routerId) => (
          <div key={routerId} className="space-y-6">
            {/* Router Health Summary (Story 5.1) */}
            <RouterHealthSummaryCard
              routerId={routerId}
              onRefresh={handleRefresh}
              enableSubscription={true}
              pollInterval={10000} // 10-second polling fallback
            />

            {/* Resource Utilization Gauges (Story 5.2) */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">Resource Utilization</h2>
              <ResourceGauges deviceId={routerId} />
            </section>

            {/* Recent System Logs (Story 5.6) */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">Recent Logs</h2>
              <RecentLogs deviceId={routerId} />
            </section>
          </div>
        ))}

        {/* Empty State - shown when no routers configured */}
        {MOCK_ROUTER_IDS.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-foreground">
                No routers configured
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Add your first router to start monitoring your network health and performance.
              </p>
              {/* TODO: Add "Add Router" button with navigation to router discovery */}
            </div>
          </div>
        )}
      </DashboardLayout>
    </div>
  );
}

/**
 * Export for route configuration
 */
export default DashboardPage;
