/**
 * useAlertNotifications Hook
 *
 * @description Subscribes to real-time alert events via GraphQL subscription
 * and manages in-app notifications with Zustand store integration, toast
 * notifications with severity-based styling, sound playback, and contextual
 * navigation hints. Respects user settings for enabled state, severity filter,
 * and sound preferences.
 *
 * Features:
 * - GraphQL subscription to alertEvents
 * - Automatic Zustand store integration
 * - Toast notifications with severity-based styling
 * - Sound playback for critical/warning/info alerts
 * - Respects user settings (enabled, severity filter, sound)
 * - Navigation hints for contextual alerts
 *
 * Task #3: Apollo Client subscription hook integration
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSubscription, gql } from '@apollo/client';
import { useToast } from '@nasnet/ui/patterns';
import { useAlertNotificationStore, type AlertSeverity } from '@nasnet/state/stores';
import { selectActiveRouterId, useConnectionStore } from '@nasnet/state/stores';

// ===== GraphQL Subscription =====

const ALERT_EVENTS_SUBSCRIPTION = gql`
  subscription AlertEvents($deviceId: ID) {
    alertEvents(deviceId: $deviceId) {
      alert {
        id
        ruleId
        eventType
        severity
        title
        message
        data
        deviceId
        triggeredAt
        acknowledgedAt
        acknowledgedBy
      }
      action
    }
  }
`;

// ===== Types =====

/**
 * Alert event from GraphQL subscription
 */
interface AlertEvent {
  alert: {
    id: string;
    ruleId: string;
    eventType: string;
    severity: AlertSeverity;
    title: string;
    message: string;
    data?: Record<string, unknown>;
    deviceId?: string;
    triggeredAt: string;
    acknowledgedAt?: string;
    acknowledgedBy?: string;
  };
  action: 'CREATED' | 'UPDATED' | 'DELETED';
}

/**
 * Subscription data from Apollo
 */
interface AlertEventsData {
  alertEvents: AlertEvent;
}

/**
 * Hook options
 */
export interface UseAlertNotificationsOptions {
  /**
   * Override device ID (defaults to activeRouterId from connection store)
   */
  deviceId?: string;

  /**
   * Whether to enable the subscription (default: true)
   */
  enabled?: boolean;
}

// ===== Navigation Mapping =====

/**
 * Map event types to app routes for contextual navigation
 */
const eventTypeToRoute: Record<string, string> = {
  'router.offline': '/dashboard',
  'router.online': '/dashboard',
  'vpn.disconnected': '/vpn',
  'vpn.connected': '/vpn',
  'interface.down': '/network/interfaces',
  'interface.up': '/network/interfaces',
  'dhcp.pool_exhausted': '/network/dhcp',
  'firewall.attack_detected': '/firewall',
  'system.high_cpu': '/system/resources',
  'system.high_memory': '/system/resources',
  'backup.failed': '/system/backup',
  'firmware.update_available': '/system/firmware',
};

// ===== Sound Playback =====

/**
 * Play alert sound based on severity
 */
function playAlertSound(severity: AlertSeverity, soundEnabled: boolean): void {
  if (!soundEnabled) return;

  // Map severity to sound file
  const soundMap: Record<AlertSeverity, string> = {
    CRITICAL: '/sounds/alert-critical.mp3',
    WARNING: '/sounds/alert-warning.mp3',
    INFO: '/sounds/alert-info.mp3',
  };

  const soundFile = soundMap[severity];
  if (!soundFile) return;

  try {
    const audio = new Audio(soundFile);
    audio.volume = 0.7; // 70% volume to avoid being jarring
    audio.play().catch((err) => {
      // Ignore errors (user may have disabled autoplay)
      console.debug('Failed to play alert sound:', err.message);
    });
  } catch (err) {
    console.debug('Audio playback not supported or failed:', err);
  }
}

// ===== Auto-Dismiss Timing =====

/**
 * Get auto-dismiss duration based on severity and user settings
 */
function getAutoDismissDuration(severity: AlertSeverity, userDuration: number): number | null {
  // Critical alerts: never auto-dismiss (require acknowledgment)
  if (severity === 'CRITICAL') {
    return null;
  }

  // Use user setting if configured
  if (userDuration > 0) {
    return userDuration;
  }

  // Default timing per severity
  const defaultDurations: Record<AlertSeverity, number> = {
    CRITICAL: 0, // Never auto-dismiss
    WARNING: 8000, // 8 seconds
    INFO: 5000, // 5 seconds
  };

  return defaultDurations[severity] || 5000;
}

// ===== Severity Filter =====

/**
 * Check if alert passes severity filter
 */
function passesSeverityFilter(severity: AlertSeverity, filter: AlertSeverity | 'ALL'): boolean {
  if (filter === 'ALL') return true;

  // Severity hierarchy: CRITICAL > WARNING > INFO
  const severityRank: Record<AlertSeverity, number> = {
    CRITICAL: 3,
    WARNING: 2,
    INFO: 1,
  };

  const alertRank = severityRank[severity] ?? 0;
  const filterRank = severityRank[filter] ?? 0;

  return alertRank >= filterRank;
}

// ===== Main Hook =====

/**
 * useAlertNotifications Hook
 *
 * @description Subscribes to real-time alert events and integrates with
 * Alert notification store (Zustand), Toast notifications (Sonner), and
 * Sound playback. Cleans up subscription on unmount.
 *
 * @example
 * ```tsx
 * function AppLayout() {
 *   // Enable subscription globally
 *   useAlertNotifications();
 *
 *   return <Outlet />;
 * }
 * ```
 *
 * @example
 * ```tsx
 * function DashboardPage() {
 *   const router = useActiveRouter();
 *
 *   // Subscribe only to alerts for this router
 *   useAlertNotifications({
 *     deviceId: router?.id,
 *     enabled: !!router,
 *   });
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useAlertNotifications(options: UseAlertNotificationsOptions = {}): void {
  const { deviceId: overrideDeviceId, enabled = true } = options;

  // Get active router ID from connection store
  const activeRouterId = useConnectionStore(selectActiveRouterId);
  const deviceId = overrideDeviceId ?? activeRouterId;

  // Get store actions and settings
  const addNotification = useAlertNotificationStore((s) => s.addNotification);
  const settings = useAlertNotificationStore((s) => s.settings);

  // Toast notification hook
  const toast = useToast();

  // Track processed alert IDs to prevent duplicates
  const processedAlerts = useRef(new Set<string>());

  // Memoize event type to route mapping for stable reference
  const eventRouteMap = useMemo(() => eventTypeToRoute, []);

  // Subscribe to alert events
  const { data } = useSubscription<AlertEventsData>(ALERT_EVENTS_SUBSCRIPTION, {
    variables: { deviceId },
    skip: !enabled || !settings.enabled || !deviceId,
    onError: (error) => {
      console.error('Alert subscription error:', error);
      // Don't show toast for subscription errors (silent failure)
    },
  });

  // Memoize toast handler callback for stable reference
  const handleShowToast = useCallback(
    (alert: AlertEvent['alert'], route: string | undefined) => {
      const autoDismissDuration = getAutoDismissDuration(
        alert.severity,
        settings.autoDismissTiming
      );

      const toastOptions = {
        message: alert.message,
        duration: autoDismissDuration,
        action:
          route ?
            {
              label: 'View',
              onClick: () => {
                window.location.href = route;
              },
            }
          : undefined,
      };

      switch (alert.severity) {
        case 'CRITICAL':
          toast.error(alert.title, toastOptions);
          break;
        case 'WARNING':
          toast.warning(alert.title, toastOptions);
          break;
        case 'INFO':
          toast.info(alert.title, toastOptions);
          break;
      }
    },
    [settings.autoDismissTiming, toast]
  );

  // Process incoming alert events
  useEffect(() => {
    if (!data?.alertEvents) return;

    const event = data.alertEvents;
    const { alert, action } = event;

    // Only process CREATED actions (ignore updates/deletes)
    if (action !== 'CREATED') return;

    // Deduplicate: Skip if already processed
    if (processedAlerts.current.has(alert.id)) return;
    processedAlerts.current.add(alert.id);

    // Clean up old processed IDs (keep last 100)
    if (processedAlerts.current.size > 100) {
      const arr = Array.from(processedAlerts.current);
      processedAlerts.current = new Set(arr.slice(-100));
    }

    // Check severity filter
    if (!passesSeverityFilter(alert.severity, settings.severityFilter)) {
      return;
    }

    // Add to Zustand store
    addNotification({
      alertId: alert.id,
      title: alert.title,
      message: alert.message,
      severity: alert.severity,
      deviceId: alert.deviceId,
      ruleId: alert.ruleId,
      data: alert.data,
    });

    // Play sound
    playAlertSound(alert.severity, settings.soundEnabled);

    // Map event type to navigation route
    const route = eventRouteMap[alert.eventType];

    // Show toast notification
    handleShowToast(alert, route);
  }, [data, addNotification, settings, eventRouteMap, handleShowToast]);

  // Cleanup on unmount: clear processed alerts and any pending operations
  useEffect(() => {
    return () => {
      processedAlerts.current.clear();
    };
  }, []);
}

/**
 * Export sound playback helper for testing and external use
 */
export { playAlertSound };
