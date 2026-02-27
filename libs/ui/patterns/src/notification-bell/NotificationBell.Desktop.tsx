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
import { Button, Badge, Popover, PopoverTrigger, PopoverContent, ScrollArea, Separator, Skeleton, cn } from '@nasnet/ui/primitives';




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
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={cn('relative h-11 w-11 rounded-full flex items-center justify-center hover:bg-muted transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring', className)}
          aria-label={`Notifications (${unreadCount} unread)`}
          aria-live="polite"
          aria-atomic="true"
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
          {showBadge && (
            <Badge
              variant="error"
              className="absolute -top-1 -right-1 h-5 min-w-[20px] rounded-full bg-error text-white text-xs font-bold flex items-center justify-center p-0"
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
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="h-auto py-1 text-xs text-primary hover:text-primary"
            >
              Mark all read
            </Button>
          )}
        </div>

        {/* Notification list */}
        <ScrollArea className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : previewNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <ul className="py-0">
              {previewNotifications.map((notification, index) => (
                <li key={notification.id}>
                  <button
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'w-full text-left px-4 py-3 border-b border-border hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      !notification.read && 'bg-primary/5'
                    )}
                    tabIndex={0}
                    aria-label={`${notification.title} - ${notification.message}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Unread indicator */}
                      {!notification.read && (
                        <div
                          className="mt-1.5 h-2 w-2 rounded-full bg-error flex-shrink-0"
                          aria-label="Unread"
                        />
                      )}

                      <div className="flex-1 min-w-0 space-y-1">
                        {/* Item icon */}
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center mb-2">
                          <Bell className="h-4 w-4 text-muted-foreground" />
                        </div>

                        {/* Title */}
                        <h4 className="text-sm font-medium text-foreground truncate">
                          {notification.title}
                        </h4>

                        {/* Message */}
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>

                        {/* Timestamp */}
                        <p className="text-xs text-muted-foreground">
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
          )}
        </ScrollArea>

        {/* Footer with "View all" */}
        {previewNotifications.length > 0 && (
          <>
            <div className="border-t border-border px-4 py-2">
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
