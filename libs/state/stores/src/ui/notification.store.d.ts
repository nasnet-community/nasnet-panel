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
export declare const useNotificationStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<NotificationState & NotificationActions>, "setState"> & {
    setState<A extends string | {
        type: string;
    }>(partial: (NotificationState & NotificationActions) | Partial<NotificationState & NotificationActions> | ((state: NotificationState & NotificationActions) => (NotificationState & NotificationActions) | Partial<NotificationState & NotificationActions>), replace?: boolean | undefined, action?: A | undefined): void;
}>;
/**
 * Select all notifications
 */
export declare const selectNotifications: (state: NotificationState) => Notification[];
/**
 * Select whether there are any notifications
 */
export declare const selectHasNotifications: (state: NotificationState) => boolean;
/**
 * Select notification count
 */
export declare const selectNotificationCount: (state: NotificationState) => number;
/**
 * Select error notifications only
 */
export declare const selectErrorNotifications: (state: NotificationState) => Notification[];
/**
 * Select notifications by type
 */
export declare const selectNotificationsByType: (type: NotificationType) => (state: NotificationState) => Notification[];
/**
 * Get notification store state outside of React
 * Useful for imperative code or testing
 */
export declare const getNotificationState: () => NotificationState & NotificationActions;
/**
 * Subscribe to notification store changes outside of React
 */
export declare const subscribeNotificationState: (listener: (state: NotificationState & NotificationActions, prevState: NotificationState & NotificationActions) => void) => () => void;
/**
 * Show a success notification
 */
export declare function showSuccess(title: string, message?: string): string;
/**
 * Show an error notification
 */
export declare function showError(title: string, message?: string): string;
/**
 * Show a warning notification
 */
export declare function showWarning(title: string, message?: string): string;
/**
 * Show an info notification
 */
export declare function showInfo(title: string, message?: string): string;
//# sourceMappingURL=notification.store.d.ts.map