/**
 * useRateLimitStatsOverview Hook
 * Headless logic for rate limit statistics overview
 *
 * NAS-7.11: Implement Connection Rate Limiting
 */

import { useState, useMemo } from 'react';

import { useRateLimitStats } from '@nasnet/api-client/queries';

import { POLLING_INTERVAL_CONFIGS } from './types';

import type {
  RateLimitStatsOverviewProps,
  StatsOverviewState,
  StatsOverviewActions,
  PollingInterval,
  ChartDataPoint,
  ExportData,
} from './types';

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
export function useRateLimitStatsOverview(props: RateLimitStatsOverviewProps): {
  state: StatsOverviewState;
  actions: StatsOverviewActions;
} {
  const { routerId } = props;

  // Polling interval state
  const [pollingInterval, setPollingInterval] = useState<PollingInterval>('5s');

  // Fetch stats with polling
  const {
    data: stats,
    isLoading: loading,
    error,
    refetch,
  } = useRateLimitStats(routerId, {
    pollingInterval: POLLING_INTERVAL_CONFIGS[pollingInterval].milliseconds,
  });

  // Transform chart data for Recharts
  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (!stats?.triggerEvents) return [];

    return stats.triggerEvents.map((event) => ({
      hour: event.hour,
      count: event.count,
      timestamp: new Date(event.hour).getTime(),
    }));
  }, [stats]);

  // Calculate trend (compare last 2 hours if available)
  const trend = useMemo<number>(() => {
    if (!chartData || chartData.length < 2) return 0;

    const latest = chartData[chartData.length - 1];
    const previous = chartData[chartData.length - 2];

    return latest.count - previous.count;
  }, [chartData]);

  // Export to CSV
  const exportToCsv = () => {
    if (!stats) return;

    const exportData: ExportData[] = chartData.map((point, index) => {
      const topIP = stats.topBlockedIPs[0];
      return {
        timestamp: new Date(point.timestamp).toISOString(),
        blockedCount: point.count,
        topIP: topIP?.address || 'N/A',
        topIPCount: topIP?.blockCount || 0,
      };
    });

    // Convert to CSV format
    const headers = ['Timestamp', 'Blocked Count', 'Top IP', 'Top IP Count'];
    const csvRows = [
      headers.join(','),
      ...exportData.map((row) =>
        [row.timestamp, row.blockedCount, row.topIP, row.topIPCount].join(',')
      ),
    ];
    const csvContent = csvRows.join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rate-limit-stats-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Refresh stats manually
  const refresh = () => {
    refetch();
  };

  // Build state
  const state: StatsOverviewState = {
    stats: stats || null,
    loading,
    error: error?.message || null,
    pollingInterval,
    chartData,
    trend,
    lastUpdated: stats?.lastUpdated || null,
  };

  // Build actions
  const actions: StatsOverviewActions = {
    setPollingInterval,
    exportToCsv,
    refresh,
  };

  return { state, actions };
}
