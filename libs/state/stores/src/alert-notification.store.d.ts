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
    notifications: InAppNotification[];
    unreadCount: number;
    settings: NotificationSettings;
    addNotification: (notification: Omit<InAppNotification, 'id' | 'read' | 'receivedAt'>) => void;
    markAsRead: (notificationId: string) => void;
    markAllRead: () => void;
    clearNotification: (notificationId: string) => void;
    clearAll: () => void;
    updateSettings: (settings: Partial<NotificationSettings>) => void;
    _filterOldNotifications: () => void;
    _updateUnreadCount: () => void;
}
/**
 * Alert Notification Store
 * - Persisted: settings only
 * - Non-persisted: notifications (memory only, filtered on rehydration)
 */
export declare const useAlertNotificationStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<AlertNotificationState>, "persist"> & {
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<AlertNotificationState, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: AlertNotificationState) => void) => () => void;
        onFinishHydration: (fn: (state: AlertNotificationState) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<AlertNotificationState, unknown>>;
    };
}>;
/**
 * Selector hooks for optimized access
 */
/** Get all notifications */
export declare const useNotifications: () => InAppNotification[];
/** Get unread count */
export declare const useUnreadCount: () => number;
/** Get unread notifications only */
export declare const useUnreadNotifications: () => InAppNotification[];
/** Get notification settings */
export declare const useNotificationSettings: () => NotificationSettings;
/** Get notifications filtered by severity */
export declare const useNotificationsBySeverity: (severity: AlertSeverity) => InAppNotification[];
/** Get notifications for a specific device */
export declare const useNotificationsByDevice: (deviceId: string) => InAppNotification[];
//# sourceMappingURL=alert-notification.store.d.ts.map