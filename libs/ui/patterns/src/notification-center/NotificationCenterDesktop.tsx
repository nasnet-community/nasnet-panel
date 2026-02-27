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
function NotificationCenterDesktopComponent({ open, onClose, className }: NotificationCenterProps) {
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

  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
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
          setFocusedIndex((prev) => (prev < filteredNotifications.length - 1 ? prev + 1 : prev));
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
        side="right"
        className={cn(
          'bg-popover border-border flex w-80 flex-col gap-0 rounded-[var(--semantic-radius-card)] border p-0 shadow-[var(--semantic-shadow-dropdown)]',
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

            <div className="flex items-center gap-2">
              {/* Mark all read button */}
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllRead}
                  className="text-primary hover:text-primary h-auto py-1 text-xs"
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
                  className="text-error hover:text-error h-auto py-1 text-xs"
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
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Notification list */}
        <ScrollArea className="max-h-[400px] flex-1 overflow-y-auto">
          {filteredNotifications.length === 0 ?
            <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
              <p className="text-muted-foreground text-sm">
                {severityFilter === 'ALL' ?
                  'No notifications'
                : `No ${severityFilter.toLowerCase()} notifications`}
              </p>
            </div>
          : <ul className="py-0">
              {filteredNotifications.map((notification: InAppNotification, index: number) => (
                <li
                  key={notification.id}
                  ref={(el) => {
                    itemRefs.current[index] = el;
                  }}
                >
                  <NotificationItem
                    notification={notification}
                    onClick={handleNotificationClick}
                  />
                </li>
              ))}
            </ul>
          }
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

export const NotificationCenterDesktop = memo(NotificationCenterDesktopComponent);
NotificationCenterDesktop.displayName = 'NotificationCenterDesktop';
