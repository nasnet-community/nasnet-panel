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

import { useState, useMemo } from 'react';

import { useAlertNotificationStore, type InAppNotification } from '@nasnet/state/stores';

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
export function useNotificationCenter(): UseNotificationCenterReturn {
  const [severityFilter, setSeverityFilter] = useState<SeverityFilterOption>('ALL');

  // Get store state and actions
  const notifications = useAlertNotificationStore((state) => state.notifications);
  const unreadCount = useAlertNotificationStore((state) => state.unreadCount);
  const markAsRead = useAlertNotificationStore((state) => state.markAsRead);
  const markAllRead = useAlertNotificationStore((state) => state.markAllRead);
  const clearAll = useAlertNotificationStore((state) => state.clearAll);

  // Filter notifications by severity
  const filteredNotifications = useMemo(() => {
    if (severityFilter === 'ALL') {
      return notifications;
    }

    return notifications.filter((n) => n.severity === severityFilter);
  }, [notifications, severityFilter]);

  return {
    allNotifications: notifications,
    filteredNotifications,
    severityFilter,
    setSeverityFilter,
    markAsRead,
    markAllRead,
    clearAll,
    unreadCount,
    totalCount: notifications.length,
    filteredCount: filteredNotifications.length,
  };
}
