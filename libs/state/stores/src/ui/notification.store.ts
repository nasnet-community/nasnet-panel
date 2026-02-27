/// <reference types="vite/client" />

/**
 * Notification State Store
 * Manages toast/notification queue with deduplication
 *
 * Features:
 * - Notification queue with max size (10)
 * - Auto-generated notification IDs
 * - Deduplication within 2 second window
 * - Different durations based on notification type
 * - Progress notifications for long-running operations
 * - Action buttons on notifications
 * - Redux DevTools integration
 * - Session-only (not persisted)
 *
 * @see NAS-4.5: Implement UI State with Zustand
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Notification type variants
 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'progress';

/**
 * Notification action - button displayed on notification
 */
export interface NotificationAction {
  /**
   * Button label text
   */
  label: string;

  /**
   * Click handler
   */
  onClick: () => void;
}

/**
 * Notification interface
 */
export interface Notification {
  /**
   * Unique notification ID (auto-generated)
   */
  id: string;

  /**
   * Notification type
   */
  type: NotificationType;

  /**
   * Notification title (required)
   */
  title: string;

  /**
   * Optional message body
   */
  message?: string;

  /**
   * Duration in milliseconds before auto-dismiss
   * null = no auto-dismiss (manual close only)
   * Default: 4000 for success/info/warning, null for error
   */
  duration?: number | null;

  /**
   * Optional action button
   */
  action?: NotificationAction;

  /**
   * Progress value (0-100) for progress type notifications
   */
  progress?: number;

  /**
   * Timestamp when notification was created
   */
  createdAt: Date;
}

/**
 * Input type for adding notifications (without auto-generated fields)
 */
export type NotificationInput = Omit<Notification, 'id' | 'createdAt'>;

/**
 * Notification state interface
 */
export interface NotificationState {
  /**
   * Queue of active notifications
   * Ordered by creation time (oldest first)
   */
  notifications: Notification[];
}

/**
 * Notification actions interface
 */
export interface NotificationActions {
  /**
   * Add a notification to the queue
   * Auto-generates ID and timestamp
   * Returns the notification ID (empty string if deduplicated)
   *
   * @param notification - Notification to add (without id/createdAt)
   * @returns Generated notification ID, or empty string if duplicate
   */
  addNotification: (notification: NotificationInput) => string;

  /**
   * Remove a notification by ID
   *
   * @param id - Notification ID to remove
   */
  removeNotification: (id: string) => void;

  /**
   * Update a notification (e.g., progress updates)
   *
   * @param id - Notification ID to update
   * @param updates - Partial notification updates
   */
  updateNotification: (id: string, updates: Partial<NotificationInput>) => void;

  /**
   * Clear all notifications
   */
  clearAllNotifications: () => void;

  /**
   * Get a notification by ID
   */
  getNotification: (id: string) => Notification | undefined;
}

// ===== Constants =====

/**
 * Maximum number of notifications in queue
 * Oldest notifications are removed when exceeded
 */
const MAX_NOTIFICATIONS = 10;

/**
 * Deduplication window in milliseconds
 * Same title+message within this window will be ignored
 */
const DEDUP_WINDOW_MS = 2000;

/**
 * Default duration by notification type (in ms)
 */
const DEFAULT_DURATION: Record<NotificationType, number | null> = {
  success: 4000,
  info: 4000,
  warning: 5000,
  error: null, // Errors don't auto-dismiss
  progress: null, // Progress notifications don't auto-dismiss
};

// ===== Helper functions =====

/**
 * Generate a unique notification ID
 */
function generateNotificationId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `notification-${timestamp}-${random}`;
}

/**
 * Check if a notification is a duplicate of existing notifications
 */
function isDuplicate(notifications: Notification[], newNotification: NotificationInput): boolean {
  const now = Date.now();

  return notifications.some(
    (existing) =>
      existing.title === newNotification.title &&
      existing.message === newNotification.message &&
      now - existing.createdAt.getTime() < DEDUP_WINDOW_MS
  );
}

/**
 * Zustand store for notification management
 *
 * Usage:
 * ```tsx
 * const { addNotification, removeNotification } = useNotificationStore();
 *
 * // Add a success notification
 * addNotification({
 *   type: 'success',
 *   title: 'Router connected',
 *   message: 'Successfully connected to 192.168.88.1',
 * });
 *
 * // Add an error notification (doesn't auto-dismiss)
 * addNotification({
 *   type: 'error',
 *   title: 'Connection failed',
 *   message: 'Could not connect to router. Check credentials.',
 * });
 *
 * // Add a notification with action
 * addNotification({
 *   type: 'info',
 *   title: 'Backup available',
 *   message: 'A new backup is ready to download.',
 *   action: {
 *     label: 'Download',
 *     onClick: () => downloadBackup(),
 *   },
 * });
 *
 * // Progress notification
 * const id = addNotification({
 *   type: 'progress',
 *   title: 'Uploading firmware...',
 *   progress: 0,
 * });
 *
 * // Update progress
 * updateNotification(id, { progress: 50 });
 * updateNotification(id, { progress: 100, title: 'Upload complete' });
 * removeNotification(id);
 * ```
 *
 * DevTools:
 * - Integrated with Redux DevTools for debugging (development only)
 * - Store name: 'notification-store'
 *
 * Persistence:
 * - NOT persisted - notifications are session-only
 */
export const useNotificationStore = create<NotificationState & NotificationActions>()(
  devtools(
    (set, get) => ({
      // Initial state
      notifications: [],

      // Actions
      addNotification: (notification) => {
        const { notifications } = get();

        // Check for duplicates
        if (isDuplicate(notifications, notification)) {
          return ''; // Return empty ID for duplicates
        }

        const id = generateNotificationId();
        const now = new Date();

        // Determine duration based on type if not explicitly set
        const duration =
          notification.duration !== undefined ?
            notification.duration
          : DEFAULT_DURATION[notification.type];

        const newNotification: Notification = {
          ...notification,
          id,
          createdAt: now,
          duration,
        };

        set(
          (state) => {
            let newNotifications = [...state.notifications, newNotification];

            // Remove oldest if exceeding max
            if (newNotifications.length > MAX_NOTIFICATIONS) {
              newNotifications = newNotifications.slice(-MAX_NOTIFICATIONS);
            }

            return { notifications: newNotifications };
          },
          false,
          `addNotification/${notification.type}`
        );

        return id;
      },

      removeNotification: (id) =>
        set(
          (state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
          }),
          false,
          `removeNotification/${id}`
        ),

      updateNotification: (id, updates) =>
        set(
          (state) => ({
            notifications: state.notifications.map((n) => (n.id === id ? { ...n, ...updates } : n)),
          }),
          false,
          `updateNotification/${id}`
        ),

      clearAllNotifications: () => set({ notifications: [] }, false, 'clearAllNotifications'),

      getNotification: (id) => get().notifications.find((n) => n.id === id),
    }),
    {
      name: 'notification-store',
      enabled:
        typeof window !== 'undefined' &&
        (typeof import.meta !== 'undefined' ? import.meta.env?.DEV !== false : true),
    }
  )
);

// ===== Selectors =====

/**
 * Select all notifications
 */
export const selectNotifications = (state: NotificationState) => state.notifications;

/**
 * Select whether there are any notifications
 */
export const selectHasNotifications = (state: NotificationState) => state.notifications.length > 0;

/**
 * Select notification count
 */
export const selectNotificationCount = (state: NotificationState) => state.notifications.length;

/**
 * Select error notifications only
 */
export const selectErrorNotifications = (state: NotificationState) =>
  state.notifications.filter((n) => n.type === 'error');

/**
 * Select notifications by type
 */
export const selectNotificationsByType = (type: NotificationType) => (state: NotificationState) =>
  state.notifications.filter((n) => n.type === type);

// ===== Helper functions (exported) =====

/**
 * Get notification store state outside of React
 * Useful for imperative code or testing
 */
export const getNotificationState = () => useNotificationStore.getState();

/**
 * Subscribe to notification store changes outside of React
 */
export const subscribeNotificationState = useNotificationStore.subscribe;

// ===== Convenience functions =====

/**
 * Show a success notification
 */
export function showSuccess(title: string, message?: string): string {
  return useNotificationStore.getState().addNotification({
    type: 'success',
    title,
    message,
  });
}

/**
 * Show an error notification
 */
export function showError(title: string, message?: string): string {
  return useNotificationStore.getState().addNotification({
    type: 'error',
    title,
    message,
  });
}

/**
 * Show a warning notification
 */
export function showWarning(title: string, message?: string): string {
  return useNotificationStore.getState().addNotification({
    type: 'warning',
    title,
    message,
  });
}

/**
 * Show an info notification
 */
export function showInfo(title: string, message?: string): string {
  return useNotificationStore.getState().addNotification({
    type: 'info',
    title,
    message,
  });
}
