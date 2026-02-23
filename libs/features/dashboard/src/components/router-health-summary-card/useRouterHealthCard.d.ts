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
import type { RouterHealthData, HealthStatus, HealthColor } from '../../types/dashboard.types';
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
    /** Router health data (null if loading or error) */
    router: RouterHealthData | null;
    /** Loading state (initial fetch only, not subscription updates) */
    isLoading: boolean;
    /** Error object if data fetch failed */
    error: Error | null;
    /** Overall health status based on thresholds */
    healthStatus: HealthStatus;
    /** Semantic color for health indicator */
    healthColor: HealthColor;
    /** Is router currently online */
    isOnline: boolean;
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
export declare function useRouterHealthCard({ routerId, pollInterval, enableSubscription, }: UseRouterHealthCardProps): UseRouterHealthCardReturn;
//# sourceMappingURL=useRouterHealthCard.d.ts.map