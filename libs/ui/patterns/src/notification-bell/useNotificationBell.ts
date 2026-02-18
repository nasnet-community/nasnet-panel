/**
 * useNotificationBell Hook
 *
 * Headless hook containing all business logic for NotificationBell.
 * Platform presenters consume this hook for shared state and behavior.
 *
 * @see ADR-018: Headless Platform Presenters
 */

import { useState, useCallback, useMemo } from 'react';

import type { InAppNotification } from '@nasnet/state/stores';

import type { NotificationBellProps, NotificationBellState } from './types';

/**
 * Format unread count for display
 * - Shows exact count up to 9
 * - Shows "9+" for 10 or more
 */
function formatUnreadCount(count: number): string {
  if (count === 0) return '0';
  if (count > 9) return '9+';
  return count.toString();
}

/**
 * Headless hook for NotificationBell pattern
 *
 * Contains all business logic, state management, and computed values.
 * Event handlers are memoized for stable references.
 *
 * @example
 * ```tsx
 * function NotificationBellMobile(props: NotificationBellProps) {
 *   const {
 *     isOpen,
 *     unreadCount,
 *     formattedCount,
 *     showBadge,
 *     handleToggle,
 *   } = useNotificationBell(props);
 *
 *   return (
 *     <Sheet open={isOpen} onOpenChange={handleToggle}>
 *       <Button>
 *         <Bell size={20} />
 *         {showBadge && <Badge>{formattedCount}</Badge>}
 *       </Button>
 *     </Sheet>
 *   );
 * }
 * ```
 */
export function useNotificationBell(
  props: NotificationBellProps
): NotificationBellState {
  const {
    unreadCount,
    notifications,
    loading = false,
    onNotificationClick,
    onMarkAllRead,
    onViewAll,
  } = props;

  // Local state for popover/sheet open state
  const [isOpen, setIsOpen] = useState(false);

  // Computed values (memoized)
  const formattedCount = useMemo(
    () => formatUnreadCount(unreadCount),
    [unreadCount]
  );

  const showBadge = useMemo(() => unreadCount > 0, [unreadCount]);

  // Event handlers with stable references
  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
  }, []);

  const handleNotificationClick = useCallback(
    (notification: InAppNotification) => {
      onNotificationClick?.(notification);
      // Keep popover/sheet open after clicking notification
      // User can manually close or navigate away
    },
    [onNotificationClick]
  );

  const handleMarkAllRead = useCallback(() => {
    onMarkAllRead?.();
  }, [onMarkAllRead]);

  const handleViewAll = useCallback(() => {
    onViewAll?.();
    // Close popover/sheet when navigating to full view
    setIsOpen(false);
  }, [onViewAll]);

  return {
    // State
    isOpen,
    unreadCount,
    notifications,
    loading,
    formattedCount,
    showBadge,

    // Handlers
    handleToggle,
    handleNotificationClick,
    handleMarkAllRead,
    handleViewAll,
    handleOpenChange,
  };
}
