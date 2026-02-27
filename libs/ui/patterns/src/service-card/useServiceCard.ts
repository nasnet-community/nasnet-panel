/**
 * useServiceCard Hook
 *
 * Headless hook containing all business logic for ServiceCard.
 * Platform presenters consume this hook for shared state and behavior.
 *
 * @see ADR-018: Headless Platform Presenters
 */

import { useMemo, useCallback } from 'react';

import type { ServiceCardProps, ServiceAction, ServiceStatus } from './types';

/**
 * Badge variant type matching primitives Badge component
 */
export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'success'
  | 'connected'
  | 'warning'
  | 'error'
  | 'info'
  | 'offline'
  | 'outline';

/**
 * Return type for useServiceCard hook
 */
export interface UseServiceCardReturn {
  // Derived state
  status: ServiceStatus;
  isRunning: boolean;
  isInstalled: boolean;
  isAvailable: boolean;
  isFailed: boolean;
  statusColor: BadgeVariant;
  statusLabel: string;
  categoryColor: string;

  // Actions
  primaryAction: ServiceAction | undefined;
  secondaryActions: ServiceAction[];
  hasActions: boolean;

  // Metrics
  hasMetrics: boolean;
  cpuUsage: number | undefined;
  memoryUsage: number | undefined;
  networkRx: number | undefined;
  networkTx: number | undefined;

  // Event handlers (stable references)
  handleClick: () => void;
  handlePrimaryAction: () => void;
}

/**
 * Get badge variant for service status
 */
function getStatusColor(status: ServiceStatus): BadgeVariant {
  switch (status) {
    case 'running':
      return 'success';
    case 'installed':
    case 'stopped':
      return 'secondary';
    case 'available':
      return 'info';
    case 'installing':
    case 'starting':
    case 'stopping':
      return 'warning';
    case 'failed':
    case 'deleting':
      return 'error';
    default:
      return 'default';
  }
}

/**
 * Get label for service status
 */
function getStatusLabel(status: ServiceStatus): string {
  switch (status) {
    case 'available':
      return 'Available';
    case 'installing':
      return 'Installing';
    case 'installed':
      return 'Installed';
    case 'starting':
      return 'Starting';
    case 'running':
      return 'Running';
    case 'stopping':
      return 'Stopping';
    case 'stopped':
      return 'Stopped';
    case 'failed':
      return 'Failed';
    case 'deleting':
      return 'Deleting';
    default:
      return 'Unknown';
  }
}

/**
 * Get color token for service category (using design system semantic tokens)
 */
function getCategoryColor(category: string): string {
  switch (category) {
    case 'privacy':
      return 'text-category-monitoring'; // Purple for privacy/monitoring
    case 'proxy':
      return 'text-category-networking'; // Blue for networking/proxy
    case 'dns':
      return 'text-success'; // Green for DNS (healthy/valid)
    case 'security':
      return 'text-category-security'; // Red for security
    case 'monitoring':
      return 'text-category-monitoring'; // Purple for monitoring
    default:
      return 'text-muted-foreground'; // Neutral gray
  }
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B/s';
  const k = 1024;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Headless hook for ServiceCard pattern
 *
 * Contains all business logic, state management, and computed values.
 * Event handlers are memoized for stable references.
 *
 * @example
 * ```tsx
 * function ServiceCardMobile(props: ServiceCardProps) {
 *   const {
 *     status,
 *     isRunning,
 *     primaryAction,
 *     handlePrimaryAction,
 *   } = useServiceCard(props);
 *
 *   return (
 *     <Card>
 *       <Badge variant={statusColor}>{statusLabel}</Badge>
 *       {primaryAction && (
 *         <Button onClick={handlePrimaryAction}>{primaryAction.label}</Button>
 *       )}
 *     </Card>
 *   );
 * }
 * ```
 */
export function useServiceCard(props: ServiceCardProps): UseServiceCardReturn {
  const { service, actions = [], onClick, showMetrics = true } = props;

  // Derived status state (memoized)
  const status = useMemo<ServiceStatus>(() => service.status || 'available', [service.status]);

  const isRunning = useMemo(() => status === 'running', [status]);
  const isInstalled = useMemo(
    () =>
      status === 'installed' ||
      status === 'stopped' ||
      status === 'starting' ||
      status === 'running' ||
      status === 'stopping',
    [status]
  );
  const isAvailable = useMemo(() => status === 'available', [status]);
  const isFailed = useMemo(() => status === 'failed', [status]);

  const statusColor = useMemo(() => getStatusColor(status), [status]);
  const statusLabel = useMemo(() => getStatusLabel(status), [status]);
  const categoryColor = useMemo(() => getCategoryColor(service.category), [service.category]);

  // Actions (memoized)
  const primaryAction = actions[0];
  const secondaryActions = useMemo(() => actions.slice(1), [actions]);
  const hasActions = actions.length > 0;

  // Metrics (memoized)
  const hasMetrics = useMemo(
    () => showMetrics && !!service.metrics,
    [showMetrics, service.metrics]
  );

  const cpuUsage = service.metrics?.cpu;
  const memoryUsage = service.metrics?.memory;
  const networkRx = service.metrics?.network?.rx;
  const networkTx = service.metrics?.network?.tx;

  // Event handlers with stable references
  const handleClick = useCallback(() => {
    onClick?.();
  }, [onClick]);

  const handlePrimaryAction = useCallback(() => {
    if (primaryAction && !primaryAction.disabled && !primaryAction.loading) {
      primaryAction.onClick();
    }
  }, [primaryAction]);

  return {
    // Derived state
    status,
    isRunning,
    isInstalled,
    isAvailable,
    isFailed,
    statusColor,
    statusLabel,
    categoryColor,

    // Actions
    primaryAction,
    secondaryActions,
    hasActions,

    // Metrics
    hasMetrics,
    cpuUsage,
    memoryUsage,
    networkRx,
    networkTx,

    // Event handlers
    handleClick,
    handlePrimaryAction,
  };
}

/**
 * Export helper for formatting bytes
 */
export { formatBytes };
