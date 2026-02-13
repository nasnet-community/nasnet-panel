/**
 * NotificationCenterMobile Component
 *
 * Mobile presenter for notification center (full-screen Sheet).
 * Optimized for touch with 44px touch targets and bottom action bar.
 */

import { memo, useCallback } from 'react';
import { X } from 'lucide-react';
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
import { useNotificationCenter } from './use-notification-center';
import { NotificationItem } from './NotificationItem';
import type { NotificationCenterProps } from './types';
import type { AlertSeverity } from '@nasnet/state/stores';

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
        className={cn('h-full flex flex-col gap-0 p-0', className)}
      >
        {/* Header */}
        <SheetHeader className="px-4 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <Badge variant="default" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </SheetTitle>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close notification center"
              className="h-11 w-11" // 44px touch target
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Severity filter buttons - 44px height for touch targets */}
          <div className="flex gap-2 mt-4 overflow-x-auto">
            {SEVERITY_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={severityFilter === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSeverityFilter(option.value)}
                className="h-11 min-w-[80px] text-sm whitespace-nowrap" // 44px touch target
              >
                {option.label}
              </Button>
            ))}
          </div>
        </SheetHeader>

        {/* Notification list */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3 pb-24">
            {/* Extra bottom padding for action bar */}
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="text-content-tertiary mb-3">
                  <svg
                    className="w-20 h-20 mx-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                </div>
                <p className="text-base font-medium text-content-secondary">
                  {severityFilter === 'ALL'
                    ? 'No notifications'
                    : `No ${severityFilter.toLowerCase()} notifications`}
                </p>
                <p className="text-sm text-content-tertiary mt-1">
                  You're all caught up!
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={handleNotificationClick}
                />
              ))
            )}
          </div>
        </ScrollArea>

        {/* Bottom action bar - fixed at bottom, 44px touch targets */}
        {filteredNotifications.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-surface flex gap-3 flex-shrink-0">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                onClick={handleMarkAllRead}
                className="h-11 flex-1" // 44px touch target
              >
                Mark all read
              </Button>
            )}

            <Button
              variant="outline"
              onClick={handleClearAll}
              className="h-11 flex-1 text-semantic-error hover:text-semantic-error border-semantic-error/30" // 44px touch target
            >
              Clear all
            </Button>
          </div>
        )}

        {/* Footer info */}
        {filteredNotifications.length > 0 && (
          <div className="px-4 py-2 text-xs text-content-tertiary text-center flex-shrink-0">
            Showing {filteredCount} notifications
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export const NotificationCenterMobile = memo(NotificationCenterMobileComponent);
NotificationCenterMobile.displayName = 'NotificationCenterMobile';
