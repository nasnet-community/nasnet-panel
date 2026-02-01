/**
 * useResourceCard Hook
 *
 * Headless hook containing all business logic for ResourceCard.
 * Platform presenters consume this hook for shared state and behavior.
 *
 * @see ADR-018: Headless Platform Presenters
 */

import { useMemo, useCallback } from 'react';

import type {
  BaseResource,
  ResourceCardProps,
  ResourceAction,
  ResourceStatus,
} from './types';

/**
 * Badge variant type matching primitives Badge component
 */
export type BadgeVariant = 'default' | 'secondary' | 'success' | 'connected' | 'warning' | 'error' | 'info' | 'offline' | 'outline';

/**
 * Return type for useResourceCard hook
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

  // Event handlers (stable references)
  handleToggle: () => void;
  handleClick: () => void;
  handlePrimaryAction: () => void;
}

/**
 * Get badge variant for status
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
 * Get label for status
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
