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
function NotificationCenterMobileComponent({ open, onClose, className }: NotificationCenterProps) {
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
    (notification: (typeof filteredNotifications)[0]) => {
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
    <Sheet
      open={open}
      onOpenChange={onClose}
    >
      <SheetContent
        side="bottom"
        className={cn(
          'bg-popover border-border flex h-full flex-col gap-0 rounded-[var(--semantic-radius-card)] border-t p-0',
          className
        )}
      >
        {/* Header */}
        <div className="border-border flex-shrink-0 border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <h3 className="text-foreground text-sm font-semibold">
              Notifications
              {unreadCount > 0 && (
                <Badge
                  variant="default"
                  className="ml-2"
                >
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
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Notification list */}
        <ScrollArea className="flex-1 overflow-y-auto">
          {filteredNotifications.length === 0 ?
            <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
              <p className="text-muted-foreground text-sm font-medium">
                {severityFilter === 'ALL' ?
                  'No notifications'
                : `No ${severityFilter.toLowerCase()} notifications`}
              </p>
            </div>
          : <ul className="py-0">
              {filteredNotifications.map((notification: InAppNotification) => (
                <li
                  key={notification.id}
                  className="border-border border-b last:border-b-0"
                >
                  <div className="min-h-[44px] px-4 py-3">
                    <NotificationItem
                      notification={notification}
                      onClick={handleNotificationClick}
                    />
                  </div>
                </li>
              ))}
            </ul>
          }
        </ScrollArea>

        {/* Bottom action bar - fixed at bottom, 44px touch targets */}
        {filteredNotifications.length > 0 && (
          <div className="border-border bg-popover flex flex-shrink-0 gap-3 border-t p-4">
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
              className="text-error hover:text-error border-error/30 h-11 flex-1"
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
