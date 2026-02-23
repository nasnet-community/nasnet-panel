/**
 * useRateLimitStatsOverview Hook
 * Headless logic for rate limit statistics overview
 *
 * NAS-7.11: Implement Connection Rate Limiting
 */
import type { RateLimitStatsOverviewProps, StatsOverviewState, StatsOverviewActions } from './types';
/**
 * useRateLimitStatsOverview Hook
 *
 * Manages rate limit statistics with auto-refresh, trend calculation,
 * and CSV export functionality.
 *
 * Features:
 * - Configurable polling interval (5s, 10s, 30s, 60s)
 * - Trend calculation (compare current hour to previous hour)
 * - Top 5 blocked IPs extraction
 * - CSV export with timestamp, blocked count, top IP
 * - Chart data transformation for Recharts
 *
 * @param props - Component props with routerId
 * @returns State and actions for stats overview
 *
 * @example
 * ```tsx
 * const { state, actions } = useRateLimitStatsOverview({ routerId: '192.168.1.1' });
 *
 * return (
 *   <div>
 *     <h2>Total Blocked: {state.stats?.totalBlocked}</h2>
 *     <p>Trend: {state.trend > 0 ? '↑' : '↓'} {Math.abs(state.trend)}</p>
 *     <button onClick={actions.exportToCsv}>Export CSV</button>
 *   </div>
 * );
 * ```
 */
export declare function useRateLimitStatsOverview(props: RateLimitStatsOverviewProps): {
    state: StatsOverviewState;
    actions: StatsOverviewActions;
};
//# sourceMappingURL=use-rate-limit-stats-overview.d.ts.map