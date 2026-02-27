/**
 * NotificationBell Desktop Presenter
 *
 * Desktop-optimized notification bell using Popover for compact notification preview.
 * Displays up to 5 recent notifications with full details and actions.
 */

import { memo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Bell } from 'lucide-react';

import type { AlertSeverity } from '@nasnet/state/stores';
import {
  Button,
  Badge,
  Popover,
  PopoverTrigger,
  PopoverContent,
  ScrollArea,
  Separator,
  Skeleton,
  cn,
} from '@nasnet/ui/primitives';

import { useNotificationBell } from './useNotificationBell';

import type { NotificationBellProps } from './types';

/**
 * Get badge variant for alert severity
 */
function getSeverityVariant(severity: AlertSeverity): 'error' | 'warning' | 'info' {
  switch (severity) {
    case 'CRITICAL':
      return 'error';
    case 'WARNING':
      return 'warning';
    case 'INFO':
      return 'info';
    default:
      return 'info';
  }
}

/**
 * Desktop notification bell with Popover
 *
 * Features:
 * - Compact popover with notification preview
 * - Shows up to 5 most recent notifications
 * - Hover states and keyboard navigation
 * - Unread count badge
 * - Quick actions: Mark all read, View all
 */
function NotificationBellDesktopComponent(props: NotificationBellProps) {
  const {
    isOpen,
    unreadCount,
    notifications,
    loading,
    formattedCount,
    showBadge,
    handleToggle,
    handleNotificationClick,
    handleMarkAllRead,
    handleViewAll,
    handleOpenChange,
  } = useNotificationBell(props);

  const { className } = props;

  // Limit to 5 most recent notifications for desktop preview
  const previewNotifications = notifications.slice(0, 5);

  return (
    <Popover
      open={isOpen}
      onOpenChange={handleOpenChange}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'hover:bg-muted focus-visible:ring-ring relative flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-150 focus-visible:ring-2',
            className
          )}
          aria-label={`Notifications (${unreadCount} unread)`}
          aria-live="polite"
          aria-atomic="true"
        >
          <Bell className="text-muted-foreground h-5 w-5" />
          {showBadge && (
            <Badge
              variant="error"
              className="bg-error absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full p-0 text-xs font-bold text-white"
              aria-hidden="true"
            >
              {formattedCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 p-0"
        align="end"
        sideOffset={8}
        role="dialog"
        aria-label="Notifications preview"
      >
        {/* Header */}
        <div className="border-border flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-foreground text-sm font-semibold">Notifications</h3>
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
        </div>

        {/* Notification list */}
        <ScrollArea className="max-h-[400px] overflow-y-auto">
          {loading ?
            <div className="space-y-3 p-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="space-y-2"
                >
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          : previewNotifications.length === 0 ?
            <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
              <Bell className="text-muted-foreground mb-2 h-8 w-8" />
              <p className="text-muted-foreground text-sm">No notifications</p>
            </div>
          : <ul className="py-0">
              {previewNotifications.map((notification, index) => (
                <li key={notification.id}>
                  <button
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'border-border hover:bg-muted focus-visible:ring-ring w-full border-b px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2',
                      !notification.read && 'bg-primary/5'
                    )}
                    tabIndex={0}
                    aria-label={`${notification.title} - ${notification.message}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Unread indicator */}
                      {!notification.read && (
                        <div
                          className="bg-error mt-1.5 h-2 w-2 flex-shrink-0 rounded-full"
                          aria-label="Unread"
                        />
                      )}

                      <div className="min-w-0 flex-1 space-y-1">
                        {/* Item icon */}
                        <div className="bg-muted mb-2 flex h-8 w-8 items-center justify-center rounded-full">
                          <Bell className="text-muted-foreground h-4 w-4" />
                        </div>

                        {/* Title */}
                        <h4 className="text-foreground truncate text-sm font-medium">
                          {notification.title}
                        </h4>

                        {/* Message */}
                        <p className="text-muted-foreground line-clamp-2 text-xs">
                          {notification.message}
                        </p>

                        {/* Timestamp */}
                        <p className="text-muted-foreground text-xs">
                          {formatDistanceToNow(new Date(notification.receivedAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          }
        </ScrollArea>

        {/* Footer with "View all" */}
        {previewNotifications.length > 0 && (
          <>
            <div className="border-border border-t px-4 py-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleViewAll}
                className="w-full justify-center text-sm"
              >
                View all
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

export const NotificationBellDesktop = memo(NotificationBellDesktopComponent);
NotificationBellDesktop.displayName = 'NotificationBellDesktop';
