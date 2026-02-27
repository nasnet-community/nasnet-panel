/**
 * NotificationCenterMobile Component
 *
 * Mobile presenter for notification center (full-screen Sheet).
 * Optimized for touch with 44px touch targets and bottom action bar.
 */

import { memo, useCallback } from 'react';

import { X } from 'lucide-react';

import type { AlertSeverity, InAppNotification } from '@nasnet/state/stores';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Button,
  Badge,
  ScrollArea,
  cn,
} from '@nasnet/ui/primitives';

import { NotificationItem } from './NotificationItem';
import { useNotificationCenter } from './use-notification-center';

import type { NotificationCenterProps } from './types';

const SEVERITY_OPTIONS: Array<{ value: AlertSeverity | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All' },
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'WARNING', label: 'Warning' },
  { value: 'INFO', label: 'Info' },
];

/**
 * NotificationCenterMobile - Full-screen sheet for mobile
 *
 * Features:
 * - Full-screen sheet with 44px touch targets
 * - Header with title and close button
 * - Severity filter buttons (44px height)
 * - Scrollable notification list
 * - Bottom action bar with "Mark all read" and "Clear" buttons
 * - Empty state when no notifications
 */
function NotificationCenterMobileComponent({
  open,
  onClose,
  className,
}: NotificationCenterProps) {
  const {
    filteredNotifications,
    severityFilter,
    setSeverityFilter,
    markAsRead,
    markAllRead,
    clearAll,
    unreadCount,
    filteredCount,
  } = useNotificationCenter();

  const handleNotificationClick = useCallback(
    (notification: typeof filteredNotifications[0]) => {
      markAsRead(notification.id);
      // TODO: Navigate to relevant page based on notification.deviceId, notification.ruleId
      // For now, just mark as read
    },
    [markAsRead]
  );

  const handleMarkAllRead = useCallback(() => {
    markAllRead();
  }, [markAllRead]);

  const handleClearAll = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      clearAll();
    }
  }, [clearAll]);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className={cn('h-full flex flex-col gap-0 p-0 bg-popover border-t border-border rounded-[var(--semantic-radius-card)]', className)}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              Notifications
              {unreadCount > 0 && (
                <Badge variant="default" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </h3>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close notification center"
              className="h-11 w-11"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Notification list */}
        <ScrollArea className="flex-1 overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <p className="text-sm text-muted-foreground font-medium">
                {severityFilter === 'ALL'
                  ? 'No notifications'
                  : `No ${severityFilter.toLowerCase()} notifications`}
              </p>
            </div>
          ) : (
            <ul className="py-0">
              {filteredNotifications.map((notification: InAppNotification) => (
                <li key={notification.id} className="border-b border-border last:border-b-0">
                  <div className="px-4 py-3 min-h-[44px]">
                    <NotificationItem
                      notification={notification}
                      onClick={handleNotificationClick}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>

        {/* Bottom action bar - fixed at bottom, 44px touch targets */}
        {filteredNotifications.length > 0 && (
          <div className="p-4 border-t border-border bg-popover flex gap-3 flex-shrink-0">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                onClick={handleMarkAllRead}
                className="h-11 flex-1"
              >
                Mark all read
              </Button>
            )}

            <Button
              variant="outline"
              onClick={handleClearAll}
              className="h-11 flex-1 text-error hover:text-error border-error/30"
            >
              Clear all
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export const NotificationCenterMobile = memo(NotificationCenterMobileComponent);
NotificationCenterMobile.displayName = 'NotificationCenterMobile';
