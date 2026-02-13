/**
 * NotificationBell Types
 *
 * TypeScript interfaces for the NotificationBell pattern component.
 */

import type { InAppNotification } from '@nasnet/state/stores';

/**
 * NotificationBell component props
 */
export interface NotificationBellProps {
  /** Number of unread notifications */
  unreadCount: number;

  /** Recent notifications to display in preview */
  notifications: InAppNotification[];

  /** Whether notifications are currently loading */
  loading?: boolean;

  /** Handler for when notification is clicked */
  onNotificationClick?: (notification: InAppNotification) => void;

  /** Handler for "Mark all read" action */
  onMarkAllRead?: () => void;

  /** Handler for "View all" action */
  onViewAll?: () => void;

  /** Additional CSS classes */
  className?: string;
}

/**
 * NotificationBell state (returned from headless hook)
 */
export interface NotificationBellState {
  /** Whether the notification popover/sheet is open */
  isOpen: boolean;

  /** Number of unread notifications */
  unreadCount: number;

  /** Recent notifications to display */
  notifications: InAppNotification[];

  /** Whether notifications are loading */
  loading: boolean;

  /** Formatted unread count for display (e.g., "9+") */
  formattedCount: string;

  /** Whether to show the notification badge */
  showBadge: boolean;

  /** Handlers */
  handleToggle: () => void;
  handleNotificationClick: (notification: InAppNotification) => void;
  handleMarkAllRead: () => void;
  handleViewAll: () => void;
  handleOpenChange: (open: boolean) => void;
}
