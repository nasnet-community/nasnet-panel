/**
 * useServiceAlertToasts Hook
 *
 * Subscribes to real-time service alert events and displays toast notifications.
 * Integrates with the global notification store for consistent UI.
 *
 * Features:
 * - Real-time subscription to SERVICE_ALERT_EVENTS
 * - Severity-based toast styling and timing
 * - Deduplication to prevent duplicate toasts (last 100 alerts)
 * - "View Service" action button for CRITICAL alerts
 * - Custom timing overrides for service alerts
 *
 * @see Task #13: Implement service alert toasts
 */

import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  useServiceAlertSubscription,
  type AlertSeverity,
  type AlertEvent,
} from '@nasnet/api-client/queries';
import { useNotificationStore } from '@nasnet/state/stores';

// ============================================================================
// Types
// ============================================================================

/**
 * Props for useServiceAlertToasts hook
 */
export interface UseServiceAlertToastsProps {
  /**
   * Router ID to subscribe to alerts for
   * If omitted, subscribes to all routers
   */
  routerId?: string;

  /**
   * Enable toast notifications (default: true)
   * Set to false to disable toasts (useful for specific pages)
   */
  enabled?: boolean;

  /**
   * Optional callback when a toast is shown
   */
  onToastShown?: (alertId: string, severity: AlertSeverity) => void;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Service alert toast timings (overrides default notification timings)
 *
 * - CRITICAL: Persistent (no auto-dismiss) - requires user action
 * - WARNING: 8 seconds - longer than default to ensure visibility
 * - INFO: 5 seconds - standard informational timing
 */
const TOAST_DURATIONS: Record<AlertSeverity, number | null> = {
  CRITICAL: null, // No auto-dismiss - stays until manually closed
  WARNING: 8000, // 8 seconds (longer than default 5s)
  INFO: 5000, // 5 seconds
};

/**
 * Map alert severity to notification type
 */
const SEVERITY_TO_TYPE: Record<
  AlertSeverity,
  'error' | 'warning' | 'info'
> = {
  CRITICAL: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

/**
 * Maximum number of alert IDs to track for deduplication
 * Prevents memory bloat from long-running sessions
 */
const MAX_DEDUP_SIZE = 100;

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Service alert toast notification hook
 *
 * Subscribes to real-time service alert events and displays toast notifications
 * using the global notification store. Implements deduplication to prevent
 * showing the same alert multiple times.
 *
 * @example
 * ```tsx
 * // In app root layout
 * function AppLayout() {
 *   useServiceAlertToasts({
 *     routerId: currentRouterId,
 *     enabled: true,
 *   });
 *
 *   return <div>{children}</div>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Disable on specific page (e.g., service detail page shows alerts inline)
 * function ServiceDetailPage() {
 *   useServiceAlertToasts({ enabled: false });
 *   return <div>...</div>;
 * }
 * ```
 */
export function useServiceAlertToasts(
  props: UseServiceAlertToastsProps = {}
) {
  const { routerId, enabled = true, onToastShown } = props;

  const navigate = useNavigate();
  const { addNotification } = useNotificationStore();

  // Deduplication tracking: Set of alert IDs we've already shown
  const seenAlertIds = useRef<Set<string>>(new Set());

  // Subscribe to service alert events
  const { alertEvent } = useServiceAlertSubscription(
    routerId ? { deviceId: routerId } : undefined,
    enabled
  );

  /**
   * Handle new alert event
   */
  const handleAlertEvent = useCallback(
    (event: AlertEvent) => {
      const { alert, action } = event;

      // Only show toasts for newly created alerts
      if (action !== 'CREATED') {
        return;
      }

      // Deduplication check
      if (seenAlertIds.current.has(alert.id)) {
        return;
      }

      // Track this alert ID
      seenAlertIds.current.add(alert.id);

      // Enforce max dedup size (keep last 100)
      if (seenAlertIds.current.size > MAX_DEDUP_SIZE) {
        const idsArray = Array.from(seenAlertIds.current);
        const toRemove = idsArray.slice(
          0,
          seenAlertIds.current.size - MAX_DEDUP_SIZE
        );
        toRemove.forEach((id) => seenAlertIds.current.delete(id));
      }

      // Map severity to notification type and duration
      const notificationType = SEVERITY_TO_TYPE[alert.severity];
      const duration = TOAST_DURATIONS[alert.severity];

      // Show toast notification
      addNotification({
        type: notificationType,
        title: alert.title,
        message: alert.message,
        duration, // Override default timing

        // Add "View Service" action for CRITICAL alerts only
        action:
          alert.severity === 'CRITICAL'
            ? {
                label: 'View Service',
                onClick: () => {
                  // Navigate to service detail page
                  // Extract instanceId from alert.data or use deviceId
                  const instanceId =
                    (alert.data?.instanceId as string) || alert.deviceId;
                  if (instanceId) {
                    navigate(`/services/${instanceId}`);
                  }
                },
              }
            : undefined,
      });

      // Optional callback
      if (onToastShown) {
        onToastShown(alert.id, alert.severity);
      }
    },
    [addNotification, navigate, onToastShown]
  );

  // Effect: Handle alert events
  useEffect(() => {
    if (alertEvent && enabled) {
      handleAlertEvent(alertEvent);
    }
  }, [alertEvent, enabled, handleAlertEvent]);

  // No return value - this is a side-effect-only hook
}
