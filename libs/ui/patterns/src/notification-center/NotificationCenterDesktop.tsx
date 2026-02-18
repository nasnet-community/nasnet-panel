/**
 * NotificationCenterDesktop Component
 *
 * Desktop presenter for notification center (400px side panel).
 * Displays notifications in a scrollable list with severity filters.
 */

import { memo, useCallback, useEffect, useRef, useState } from 'react';

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
 * NotificationCenterDesktop - 400px side panel for desktop
 *
 * Features:
 * - Header with title, "Mark all read", and "Clear" buttons
 * - Severity filter chips (Critical, Warning, Info, All)
 * - Scrollable notification list
 * - Empty state when no notifications
 * - Keyboard navigation (Escape to close, Arrow keys to navigate, Enter to activate)
 */
function NotificationCenterDesktopComponent({
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

  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  // Handle keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;

        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) =>
            prev < filteredNotifications.length - 1 ? prev + 1 : prev
          );
          break;

        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;

        case 'Enter':
          e.preventDefault();
          if (focusedIndex >= 0 && itemRefs.current[focusedIndex]) {
            itemRefs.current[focusedIndex]?.click();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, filteredNotifications.length, focusedIndex]);

  // Focus the selected item
  useEffect(() => {
    if (focusedIndex >= 0 && itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex]);

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
        side="right"
        className={cn('w-[400px] sm:w-[400px] flex flex-col gap-0 p-0', className)}
      >
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold">
              Notifications
              {unreadCount > 0 && (
                <Badge variant="default" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </SheetTitle>

            <div className="flex items-center gap-2">
              {/* Mark all read button */}
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllRead}
                  className="text-xs"
                >
                  Mark all read
                </Button>
              )}

              {/* Clear all button */}
              {filteredNotifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="text-xs text-semantic-error hover:text-semantic-error"
                >
                  Clear
                </Button>
              )}

              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Close notification center"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Severity filter chips */}
          <div className="flex gap-2 mt-4">
            {SEVERITY_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={severityFilter === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSeverityFilter(option.value)}
                className="text-xs"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </SheetHeader>

        {/* Notification list */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-content-tertiary mb-2">
                  <svg
                    className="w-16 h-16 mx-auto"
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
                <p className="text-sm font-medium text-content-secondary">
                  {severityFilter === 'ALL'
                    ? 'No notifications'
                    : `No ${severityFilter.toLowerCase()} notifications`}
                </p>
                <p className="text-xs text-content-tertiary mt-1">
                  You're all caught up!
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification: InAppNotification, index: number) => (
                <div
                  key={notification.id}
                  ref={(el) => {
                    itemRefs.current[index] = el;
                  }}
                >
                  <NotificationItem
                    notification={notification}
                    onClick={handleNotificationClick}
                  />
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer info */}
        {filteredNotifications.length > 0 && (
          <div className="px-6 py-3 border-t border-border text-xs text-content-tertiary text-center flex-shrink-0">
            Showing {filteredCount} of {filteredNotifications.length} notifications
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export const NotificationCenterDesktop = memo(NotificationCenterDesktopComponent);
NotificationCenterDesktop.displayName = 'NotificationCenterDesktop';
