/**
 * Alert Notification Store
 * Manages in-app notification state for alert events
 *
 * Features:
 * - Real-time notification queue with deduplication
 * - Unread count tracking
 * - Persistent user settings
 * - 24-hour automatic filtering
 * - Max queue size enforcement (100 notifications)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Alert severity levels (matches GraphQL AlertSeverity)
 */
export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

/**
 * In-app notification representing an alert event
 */
export interface InAppNotification {
  /** Unique notification ID */
  id: string;

  /** Alert ID from backend */
  alertId: string;

  /** Notification title */
  title: string;

  /** Notification message/description */
  message: string;

  /** Alert severity level */
  severity: AlertSeverity;

  /** Device ID that triggered the alert */
  deviceId?: string;

  /** Alert rule ID that triggered this notification */
  ruleId?: string;

  /** Additional event data */
  data?: Record<string, unknown>;

  /** Whether notification has been read */
  read: boolean;

  /** When notification was received (ISO timestamp) */
  receivedAt: string;
}

/**
 * Notification settings (persisted)
 */
export interface NotificationSettings {
  /** Whether in-app notifications are enabled */
  enabled: boolean;

  /** Whether notification sounds are enabled */
  soundEnabled: boolean;

  /** Minimum severity level to show (filters out lower severity) */
  severityFilter: AlertSeverity | 'ALL';

  /** Auto-dismiss timing in milliseconds (0 = no auto-dismiss) */
  autoDismissTiming: number;
}

/**
 * Alert Notification State Interface
 */
export interface AlertNotificationState {
  // Notification queue
  notifications: InAppNotification[];

  // Unread count (derived from notifications)
  unreadCount: number;

  // User settings (persisted)
  settings: NotificationSettings;

  // Actions
  addNotification: (notification: Omit<InAppNotification, 'id' | 'read' | 'receivedAt'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllRead: () => void;
  clearNotification: (notificationId: string) => void;
  clearAll: () => void;
  updateSettings: (settings: Partial<NotificationSettings>) => void;

  // Internal helpers
  _filterOldNotifications: () => void;
  _updateUnreadCount: () => void;
}

/**
 * Default notification settings
 */
const defaultSettings: NotificationSettings = {
  enabled: true,
  soundEnabled: true,
  severityFilter: 'ALL',
  autoDismissTiming: 5000, // 5 seconds
};

/**
 * Initial state
 */
const initialState = {
  notifications: [] as InAppNotification[],
  unreadCount: 0,
  settings: defaultSettings,
};

/**
 * Deduplication window in milliseconds (2 seconds)
 */
const DEDUP_WINDOW_MS = 2000;

/**
 * Maximum queue size (prevent memory bloat)
 */
const MAX_QUEUE_SIZE = 100;

/**
 * Maximum notification age in milliseconds (24 hours)
 */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Check if a notification is a duplicate (same alertId within 2s window)
 */
function isDuplicate(notifications: InAppNotification[], alertId: string, now: number): boolean {
  return notifications.some((n) => {
    const age = now - new Date(n.receivedAt).getTime();
    return n.alertId === alertId && age < DEDUP_WINDOW_MS;
  });
}

/**
 * Generate unique notification ID
 */
function generateId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Filter notifications to last 24 hours
 */
function filterLast24Hours(notifications: InAppNotification[]): InAppNotification[] {
  const now = Date.now();
  return notifications.filter((n) => {
    const age = now - new Date(n.receivedAt).getTime();
    return age < MAX_AGE_MS;
  });
}

/**
 * Enforce maximum queue size (keep newest 100)
 */
function enforceMaxQueue(notifications: InAppNotification[]): InAppNotification[] {
  if (notifications.length <= MAX_QUEUE_SIZE) {
    return notifications;
  }

  // Sort by receivedAt descending (newest first) and take top 100
  return [...notifications]
    .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())
    .slice(0, MAX_QUEUE_SIZE);
}

/**
 * Alert Notification Store
 * - Persisted: settings only
 * - Non-persisted: notifications (memory only, filtered on rehydration)
 */
export const useAlertNotificationStore = create<AlertNotificationState>()(
  persist(
    (set, get) => ({
      ...initialState,

      /**
       * Add a new notification with deduplication and queue enforcement
       */
      addNotification: (notification) => {
        const now = Date.now();
        const state = get();

        // Check deduplication
        if (isDuplicate(state.notifications, notification.alertId, now)) {
          return; // Skip duplicate
        }

        // Create full notification
        const newNotification: InAppNotification = {
          ...notification,
          id: generateId(),
          read: false,
          receivedAt: new Date(now).toISOString(),
        };

        // Add to queue and enforce max size
        let updatedNotifications = [newNotification, ...state.notifications];
        updatedNotifications = enforceMaxQueue(updatedNotifications);

        set({ notifications: updatedNotifications });

        // Update unread count
        get()._updateUnreadCount();
      },

      /**
       * Mark a notification as read
       */
      markAsRead: (notificationId) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          ),
        }));

        // Update unread count
        get()._updateUnreadCount();
      },

      /**
       * Mark all notifications as read
       */
      markAllRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));

        // Update unread count
        get()._updateUnreadCount();
      },

      /**
       * Clear a single notification
       */
      clearNotification: (notificationId) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== notificationId),
        }));

        // Update unread count
        get()._updateUnreadCount();
      },

      /**
       * Clear all notifications
       */
      clearAll: () => {
        set({ notifications: [], unreadCount: 0 });
      },

      /**
       * Update notification settings
       */
      updateSettings: (settings) => {
        set((state) => ({
          settings: { ...state.settings, ...settings },
        }));
      },

      /**
       * Internal: Filter out notifications older than 24 hours
       */
      _filterOldNotifications: () => {
        set((state) => ({
          notifications: filterLast24Hours(state.notifications),
        }));

        // Update unread count after filtering
        get()._updateUnreadCount();
      },

      /**
       * Internal: Update unread count from current notifications
       */
      _updateUnreadCount: () => {
        const state = get();
        const unreadCount = state.notifications.filter((n) => !n.read).length;
        set({ unreadCount });
      },
    }),
    {
      name: 'alert-notification-store',
      storage: createJSONStorage(() => localStorage),

      // Only persist settings (not notifications)
      partialize: (state) => ({
        settings: state.settings,
      }),

      // On rehydration: filter to last 24 hours and update unread count
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._filterOldNotifications();
        }
      },
    }
  )
);

/**
 * Selector hooks for optimized access
 */

/** Get all notifications */
export const useNotifications = () => useAlertNotificationStore((state) => state.notifications);

/** Get unread count */
export const useUnreadCount = () => useAlertNotificationStore((state) => state.unreadCount);

/** Get unread notifications only */
export const useUnreadNotifications = () =>
  useAlertNotificationStore((state) => state.notifications.filter((n) => !n.read));

/** Get notification settings */
export const useNotificationSettings = () => useAlertNotificationStore((state) => state.settings);

/** Get notifications filtered by severity */
export const useNotificationsBySeverity = (severity: AlertSeverity) =>
  useAlertNotificationStore((state) => state.notifications.filter((n) => n.severity === severity));

/** Get notifications for a specific device */
export const useNotificationsByDevice = (deviceId: string) =>
  useAlertNotificationStore((state) => state.notifications.filter((n) => n.deviceId === deviceId));
