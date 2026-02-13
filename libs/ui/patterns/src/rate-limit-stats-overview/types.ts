/**
 * RateLimitStatsOverview Types
 * NAS-7.11: Implement Connection Rate Limiting
 */

import type { RateLimitStats } from '@nasnet/core/types';

/**
 * Polling interval options for stats auto-refresh
 */
export type PollingInterval = '5s' | '10s' | '30s' | '60s';

/**
 * Polling interval configuration with labels and descriptions
 */
export interface PollingIntervalConfig {
  label: string;
  description: string;
  milliseconds: number;
}

/**
 * Polling interval configurations
 */
export const POLLING_INTERVAL_CONFIGS: Record<PollingInterval, PollingIntervalConfig> = {
  '5s': {
    label: '5 seconds',
    description: 'Real-time monitoring',
    milliseconds: 5000,
  },
  '10s': {
    label: '10 seconds',
    description: 'Recommended',
    milliseconds: 10000,
  },
  '30s': {
    label: '30 seconds',
    description: 'Low bandwidth',
    milliseconds: 30000,
  },
  '60s': {
    label: '60 seconds',
    description: 'Minimal updates',
    milliseconds: 60000,
  },
};

/**
 * Props for RateLimitStatsOverview component
 */
export interface RateLimitStatsOverviewProps {
  /** Router ID for fetching stats */
  routerId: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Chart data point for timeline visualization
 */
export interface ChartDataPoint {
  hour: string;
  count: number;
  timestamp: number;
}

/**
 * CSV export data structure
 */
export interface ExportData {
  timestamp: string;
  blockedCount: number;
  topIP: string;
  topIPCount: number;
}

/**
 * Stats overview state managed by headless hook
 */
export interface StatsOverviewState {
  /** Current statistics data */
  stats: RateLimitStats | null;
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Current polling interval */
  pollingInterval: PollingInterval;
  /** Chart data points for timeline */
  chartData: ChartDataPoint[];
  /** Trend indicator (positive = increase, negative = decrease) */
  trend: number;
  /** Last updated timestamp */
  lastUpdated: Date | null;
}

/**
 * Actions for managing stats overview state
 */
export interface StatsOverviewActions {
  /** Set polling interval */
  setPollingInterval: (interval: PollingInterval) => void;
  /** Export stats to CSV */
  exportToCsv: () => void;
  /** Refresh stats manually */
  refresh: () => void;
}
