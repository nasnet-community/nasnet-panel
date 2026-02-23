/**
 * useNotificationCenter Hook
 *
 * Headless hook for notification center business logic.
 * Manages filtering, mark as read, and clear all operations.
 *
 * @example
 * ```tsx
 * const notificationCenter = useNotificationCenter();
 *
 * <NotificationCenter
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 * />
 * ```
 */
import { type InAppNotification } from '@nasnet/state/stores';
import type { SeverityFilterOption } from './types';
export interface UseNotificationCenterReturn {
    /** All notifications (unfiltered) */
    allNotifications: InAppNotification[];
    /** Filtered notifications based on current severity filter */
    filteredNotifications: InAppNotification[];
    /** Current severity filter */
    severityFilter: SeverityFilterOption;
    /** Set severity filter */
    setSeverityFilter: (filter: SeverityFilterOption) => void;
    /** Mark a notification as read */
    markAsRead: (notificationId: string) => void;
    /** Mark all notifications as read */
    markAllRead: () => void;
    /** Clear all notifications */
    clearAll: () => void;
    /** Unread count */
    unreadCount: number;
    /** Total count (all notifications) */
    totalCount: number;
    /** Filtered count */
    filteredCount: number;
}
/**
 * Headless hook for notification center logic
 */
export declare function useNotificationCenter(): UseNotificationCenterReturn;
//# sourceMappingURL=use-notification-center.d.ts.map