/**
 * useResourceCard Hook
 *
 * Headless hook containing all business logic for ResourceCard pattern.
 * Encapsulates state derivation, event handling, and memoization.
 * Platform presenters (Mobile/Tablet/Desktop) consume this hook for shared state.
 *
 * Follows the Headless + Platform Presenters architecture:
 * - All state logic in hook (no JSX)
 * - Presenters render UI only (zero logic)
 * - Event handlers have stable memoized references
 * - Derived state computed once per props change
 *
 * @see ADR-018: Headless + Platform Presenters
 * @see ResourceCard.tsx for component wrapper with platform auto-detection
 * @see ResourceCard.Mobile.tsx, ResourceCard.Desktop.tsx for presenter implementations
 *
 * @example
 * ```tsx
 * // In a platform presenter component
 * function ResourceCardDesktop<T extends BaseResource>(props: ResourceCardProps<T>) {
 *   const {
 *     status,
 *     statusColor,
 *     primaryAction,
 *     handlePrimaryAction,
 *     secondaryActions,
 *   } = useResourceCard(props);
 *
 *   return (
 *     <Card>
 *       <Badge variant={statusColor}>{status}</Badge>
 *       {primaryAction && (
 *         <Button onClick={handlePrimaryAction}>{primaryAction.label}</Button>
 *       )}
 *       {secondaryActions.length > 0 && (
 *         <DropdownMenu items={secondaryActions} />
 *       )}
 *     </Card>
 *   );
 * }
 * ```
 */

import { useMemo, useCallback } from 'react';

import type {
  BaseResource,
  ResourceCardProps,
  ResourceAction,
  ResourceStatus,
} from './types';

/**
 * Badge variant type matching shadcn Badge component variants
 *
 * Maps status to semantic color tokens:
 * - success: Green (#22C55E) for online/connected
 * - warning: Amber (#F59E0B) for pending/degraded
 * - error: Red (#EF4444) for offline/failed
 * - connected: Green with different styling for connected state
 * - offline: Gray for disconnected
 */
export type BadgeVariant = 'default' | 'secondary' | 'success' | 'connected' | 'warning' | 'error' | 'info' | 'offline' | 'outline';

/**
 * Return type for useResourceCard hook - all computed state and handlers
 *
 * @interface UseResourceCardReturn
 * @property status - Current resource status from runtime
 * @property isOnline - Boolean convenience: true if status is 'online' or 'connected'
 * @property statusColor - BadgeVariant matching status for UI rendering
 * @property statusLabel - Translatable display label for status
 * @property primaryAction - First action (primary CTA)
 * @property secondaryActions - Remaining actions (shown in menu)
 * @property hasActions - Whether any actions are available
 * @property handleToggle - Stable memoized toggle callback
 * @property handleClick - Stable memoized card click callback
 * @property handlePrimaryAction - Stable memoized primary action callback
 */
export interface UseResourceCardReturn {
  // Derived state
  status: ResourceStatus;
  isOnline: boolean;
  statusColor: BadgeVariant;
  statusLabel: string;

  // Actions
  primaryAction: ResourceAction | undefined;
  secondaryActions: ResourceAction[];
  hasActions: boolean;

  // Event handlers (stable memoized references for optimal rendering)
  handleToggle: () => void;
  handleClick: () => void;
  handlePrimaryAction: () => void;
}

/**
 * Maps ResourceStatus to BadgeVariant for color-coded UI rendering
 *
 * Follows NasNetConnect design system semantic colors:
 * - success (green #22C55E): online, healthy, valid
 * - warning (amber #F59E0B): pending, degraded, caution
 * - error (red #EF4444): offline, failed, error
 * - connected (green variant): explicitly connected state
 * - offline (gray): disconnected, unavailable
 *
 * @param status - ResourceStatus value from resource.runtime.status
 * @returns BadgeVariant for UI rendering
 */
function getStatusColor(status: ResourceStatus): BadgeVariant {
  switch (status) {
    case 'online':
      return 'success';
    case 'connected':
      return 'connected';
    case 'offline':
    case 'disconnected':
      return 'offline';
    case 'pending':
      return 'warning';
    case 'error':
      return 'error';
    case 'warning':
      return 'warning';
    default:
      return 'offline';
  }
}

/**
 * Maps ResourceStatus to human-readable display labels
 *
 * Note: In production, these should be i18n keys (e.g., 'status.online', 'status.offline')
 * for multi-language support. This implementation uses English labels for demonstration.
 *
 * Status labels should remain in English regardless of locale, similar to technical terms
 * like DHCP, DNS, NAT, IP, MAC per WCAG i18n guidelines.
 *
 * @param status - ResourceStatus value from resource.runtime.status
 * @returns Human-readable status label
 *
 * @todo Implement i18n integration for translatable status labels
 */
function getStatusLabel(status: ResourceStatus): string {
  switch (status) {
    case 'online':
      return 'Online';
    case 'offline':
      return 'Offline';
    case 'connected':
      return 'Connected';
    case 'disconnected':
      return 'Disconnected';
    case 'pending':
      return 'Pending';
    case 'error':
      return 'Error';
    case 'warning':
      return 'Warning';
    default:
      return 'Unknown';
  }
}

/**
 * Headless hook for ResourceCard pattern
 *
 * Contains all business logic, state management, and computed values.
 * Event handlers are memoized for stable references.
 *
 * @example
 * ```tsx
 * function ResourceCardMobile<T extends BaseResource>(props: ResourceCardProps<T>) {
 *   const {
 *     status,
 *     isOnline,
 *     primaryAction,
 *     handlePrimaryAction,
 *   } = useResourceCard(props);
 *
 *   return (
 *     <Card>
 *       <Badge variant={statusColor}>{status}</Badge>
 *       {primaryAction && (
 *         <Button onClick={handlePrimaryAction}>{primaryAction.label}</Button>
 *       )}
 *     </Card>
 *   );
 * }
 * ```
 */
export function useResourceCard<T extends BaseResource>(
  props: ResourceCardProps<T>
): UseResourceCardReturn {
  const { resource, actions = [], onToggle, onClick } = props;

  // Derived status state (memoized)
  const status = useMemo<ResourceStatus>(
    () => resource.runtime?.status || 'unknown',
    [resource.runtime?.status]
  );

  const isOnline = useMemo(
    () => status === 'online' || status === 'connected',
    [status]
  );

  const statusColor = useMemo(() => getStatusColor(status), [status]);
  const statusLabel = useMemo(() => getStatusLabel(status), [status]);

  // Actions (memoized)
  const primaryAction = actions[0];
  const secondaryActions = useMemo(() => actions.slice(1), [actions]);
  const hasActions = actions.length > 0;

  // Event handlers with stable references
  const handleToggle = useCallback(() => {
    onToggle?.();
  }, [onToggle]);

  const handleClick = useCallback(() => {
    onClick?.();
  }, [onClick]);

  const handlePrimaryAction = useCallback(() => {
    if (primaryAction && !primaryAction.disabled) {
      primaryAction.onClick();
    }
  }, [primaryAction]);

  return {
    // Derived state
    status,
    isOnline,
    statusColor,
    statusLabel,

    // Actions
    primaryAction,
    secondaryActions,
    hasActions,

    // Event handlers
    handleToggle,
    handleClick,
    handlePrimaryAction,
  };
}
