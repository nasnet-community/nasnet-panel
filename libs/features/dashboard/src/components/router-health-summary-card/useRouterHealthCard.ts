/**
 * useRouterHealthCard Hook
 * Epic 5 - Story 5.1: Dashboard Layout with Router Health Summary
 *
 * Headless hook implementing shared business logic for RouterHealthSummaryCard.
 * This hook abstracts data fetching, health computation, and cache age calculations.
 *
 * Pattern: Headless + Platform Presenters (ADR-018)
 * - This hook contains ALL business logic (NO UI code)
 * - Presenters (Mobile/Desktop) receive computed state and render UI
 *
 * @see ADR-018: Headless Platform Presenters
 * @see Story 4.4: Apollo Client Setup
 */

import { useCallback, useMemo } from 'react';
import type { RouterHealthData, HealthStatus, HealthColor } from '../../types/dashboard.types';
import {
  computeHealthStatus,
  getHealthColor,
  getCacheAgeMinutes,
  getCacheStatus,
  shouldDisableMutations,
} from './health-utils';

/**
 * Hook configuration props
 */
export interface UseRouterHealthCardProps {
  /** UUID of router to display */
  routerId: string;
  /** Polling interval in ms (default: 10000) - used as fallback if subscription drops */
  pollInterval?: number;
  /** Enable real-time subscription (default: true) */
  enableSubscription?: boolean;
}

/**
 * Hook return value - computed state for presenters
 */
export interface UseRouterHealthCardReturn {
  // ===== Data =====
  /** Router health data (null if loading or error) */
  router: RouterHealthData | null;
  /** Loading state (initial fetch only, not subscription updates) */
  isLoading: boolean;
  /** Error object if data fetch failed */
  error: Error | null;

  // ===== Computed Health Status =====
  /** Overall health status based on thresholds */
  healthStatus: HealthStatus;
  /** Semantic color for health indicator */
  healthColor: HealthColor;
  /** Is router currently online */
  isOnline: boolean;

  // ===== Cache Staleness =====
  /** Is cached data stale (>1 minute old) */
  isStale: boolean;
  /** Cache age in minutes */
  cacheAgeMinutes: number;
  /** Cache status: fresh | warning | critical */
  cacheStatus: 'fresh' | 'warning' | 'critical';
  /** Should mutations be disabled due to stale cache */
  mutationsDisabled: boolean;
  /** Reason why mutations are disabled */
  mutationDisabledReason: string | null;

  // ===== Actions =====
  /** Manually refetch router data */
  refetch: () => Promise<void>;
}

/**
 * Headless hook for RouterHealthSummaryCard
 *
 * Provides computed state and actions for router health display.
 * This hook will integrate with GraphQL queries and subscriptions in Task 4.
 *
 * @description Computes router health status, cache staleness, and provides refetch action.
 * Uses useMemo to stabilize derived state and useCallback for stable action references.
 *
 * @example
 * ```tsx
 * function RouterHealthSummaryCard({ routerId }: Props) {
 *   const state = useRouterHealthCard({ routerId });
 *
 *   if (state.isLoading) return <LoadingSkeleton />;
 *   if (state.error) return <ErrorState error={state.error} />;
 *
 *   return (
 *     <Card>
 *       <HealthIndicator status={state.healthStatus} color={state.healthColor} />
 *       <MetricDisplay label="Uptime" value={formatUptime(state.router.uptime)} />
 *       {state.isStale && <StaleDataBadge ageMinutes={state.cacheAgeMinutes} />}
 *     </Card>
 *   );
 * }
 * ```
 */
export function useRouterHealthCard({
  routerId,
  pollInterval = 10000,
  enableSubscription = true,
}: UseRouterHealthCardProps): UseRouterHealthCardReturn {
  // TODO (Task 4): Integrate with GraphQL query and subscription
  // For now, return mock data for component development

  // Mock data - will be replaced with useQuery and useSubscription
  const mockRouterData: RouterHealthData = {
    uuid: routerId,
    name: 'Main Router',
    model: 'MikroTik hAP ac2',
    version: '7.12.1',
    uptime: 1209600, // 14 days
    status: 'online',
    health: 'healthy',
    cpuUsage: 45,
    memoryUsage: 60,
    lastUpdate: new Date(),
    temperature: 55,
  };

  const router = mockRouterData;
  const isLoading = false;
  const error = null;

  // Compute health status from metrics
  const healthStatus = useMemo(() => {
    if (!router) return 'critical';
    return computeHealthStatus(router);
  }, [router]);

  // Get semantic color for health indicator
  const healthColor = useMemo(() => getHealthColor(healthStatus), [healthStatus]);

  // Check if router is online
  const isOnline = router?.status === 'online';

  // Compute cache age and staleness
  const cacheAgeMinutes = useMemo(() => {
    if (!router) return 0;
    return getCacheAgeMinutes(router.lastUpdate);
  }, [router]);

  const isStale = cacheAgeMinutes > 1;
  const cacheStatus = useMemo(() => getCacheStatus(cacheAgeMinutes), [cacheAgeMinutes]);

  // Determine if mutations should be disabled
  const mutationsDisabled = useMemo(
    () => shouldDisableMutations(cacheAgeMinutes),
    [cacheAgeMinutes]
  );

  const mutationDisabledReason =
    mutationsDisabled ? 'Data is too old (>5 minutes). Reconnect to router first.' : null;

  // Refetch function - memoized to prevent unnecessary callback updates
  const refetch = useCallback(async () => {
    // TODO (Task 4): Implement actual refetch with Apollo
    console.log('Refetching router health data for:', routerId);
  }, [routerId]);

  return {
    // Data
    router,
    isLoading,
    error,

    // Computed
    healthStatus,
    healthColor,
    isOnline,

    // Cache
    isStale,
    cacheAgeMinutes,
    cacheStatus,
    mutationsDisabled,
    mutationDisabledReason,

    // Actions
    refetch,
  };
}
