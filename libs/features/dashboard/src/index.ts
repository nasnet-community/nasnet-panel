/**
 * Dashboard feature library barrel export
 * Exports all dashboard-related components
 * Epic 0.8: System Logs
 * Epic 5: Dashboard & Monitoring
 */

// System Logs (Epic 0.8)
export { LogViewer } from './logs/LogViewer';
export type { LogViewerProps } from './logs/LogViewer';

// Dashboard Page (Story 5.1)
export { DashboardPage } from './pages/DashboardPage';

// Dashboard Layout (Story 5.1)
export { DashboardLayout } from './components/dashboard-layout';
export type { DashboardLayoutProps } from './components/dashboard-layout';

// Cached Data Badge (Story 5.1)
export { CachedDataBadge } from './components/cached-data-badge';
export type { CachedDataBadgeProps } from './components/cached-data-badge';

// GraphQL Hooks (Story 5.1)
export { useRouterHealth, useRouterStatusSubscription } from './hooks';
export type { UseRouterHealthOptions, UseRouterStatusSubscriptionOptions } from './hooks';

// Router Health Summary Card (Story 5.1)
export {
  RouterHealthSummaryCard,
  RouterHealthSummaryCardMobile,
  RouterHealthSummaryCardDesktop,
  useRouterHealthCard,
  computeHealthStatus,
  formatUptime,
  getHealthColor,
} from './components/router-health-summary-card';
export type {
  RouterHealthSummaryCardProps,
  UseRouterHealthCardProps,
  UseRouterHealthCardReturn,
} from './components/router-health-summary-card';

// Domain types (Story 5.1)
export type {
  RouterHealthData,
  RouterStatus,
  HealthStatus,
  HealthColor,
  CacheStatus,
  HealthThresholds,
} from './types/dashboard.types';
export { DEFAULT_HEALTH_THRESHOLDS } from './types/dashboard.types';

// Resource Utilization Display (Story 5.2)
export { ResourceGauges, CircularGauge, useResourceMetrics } from './components/ResourceGauges';
export type {
  ResourceGaugesProps,
  CircularGaugeProps,
  ResourceMetrics,
  FormattedResourceMetrics,
} from './components/ResourceGauges';

// Connected Devices Display (Story 5.4)
export { ConnectedDevices } from '../components/ConnectedDevices';
export type { ConnectedDevicesProps } from '../components/ConnectedDevices';
export { useConnectedDevices } from '../hooks/useConnectedDevices';
export type {
  UseConnectedDevicesOptions,
  UseConnectedDevicesReturn,
} from '../hooks/useConnectedDevices';

// Recent Logs Display (Story 5.6)
export { RecentLogs } from './components/RecentLogs';
export type { RecentLogsProps } from './components/RecentLogs';

// Bandwidth Chart (Story 5.3)
export {
  BandwidthChart,
  BandwidthChartDesktop,
  BandwidthChartMobile,
  useBandwidthHistory,
  TimeRangeSelector,
  InterfaceFilter,
  CustomTooltip,
  BandwidthDataTable,
  BandwidthChartSkeleton,
  BandwidthChartError,
  BandwidthChartEmpty,
  formatBitrate,
  formatBytes as formatBandwidthBytes,
  formatXAxis,
  formatYAxis,
  downsampleData,
  appendDataPoint,
  TIME_RANGE_MAP,
  AGGREGATION_MAP,
  MAX_DATA_POINTS,
  BANDWIDTH_HISTORY_QUERY,
  BANDWIDTH_SUBSCRIPTION,
  GraphQLTimeRange,
  GraphQLAggregationType,
} from './components/BandwidthChart';
export type {
  TimeRange,
  BandwidthDataPoint,
  UseBandwidthHistoryConfig,
  UseBandwidthHistoryReturn,
  BandwidthChartProps,
  BandwidthChartPresenterProps,
  CustomTooltipProps,
  TimeRangeSelectorProps,
  InterfaceFilterProps,
  BandwidthDataTableProps,
} from './components/BandwidthChart';

// Interface Grid (Story 5.5)
export {
  InterfaceGrid,
  InterfaceStatusCard,
  InterfaceDetailSheet,
  useInterfaces,
  formatTrafficRate,
  formatLinkSpeed,
  sortInterfacesByPriority,
  INTERFACE_TYPE_PRIORITY,
} from './components/InterfaceGrid';
export type {
  InterfaceGridData,
  InterfaceGridProps,
  InterfaceStatusCardProps,
  InterfaceDetailSheetProps,
  InterfaceType,
  InterfaceStatus,
} from './components/InterfaceGrid';
