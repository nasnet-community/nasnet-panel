/**
 * NotificationBell Mobile Presenter
 *
 * Mobile-optimized notification bell using Sheet (bottom drawer) for full-screen notifications.
 * Touch-friendly with large tap targets and simplified layout.
 */

import { memo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Bell } from 'lucide-react';

import type { AlertSeverity } from '@nasnet/state/stores';
import {
  Button,
  Badge,
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
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
 * Mobile notification bell with Sheet (bottom drawer)
 *
 * Features:
 * - Full-screen bottom sheet for notifications
 * - Large touch targets (44px minimum)
 * - Simplified layout for mobile screens
 * - Unread count badge
 * - Quick actions at bottom
 */
function NotificationBellMobileComponent(props: NotificationBellProps) {
  const {
    isOpen,
    unreadCount,
    notifications,
    loading,
    formattedCount,
    showBadge,
    handleNotificationClick,
    handleMarkAllRead,
    handleViewAll,
    handleOpenChange,
  } = useNotificationBell(props);

  const { className } = props;

  return (
    <Sheet
      open={isOpen}
      onOpenChange={handleOpenChange}
    >
      <SheetTrigger asChild>
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
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="h-[85vh] p-0"
        role="dialog"
        aria-label="Notifications"
      >
        <SheetHeader className="border-border border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-foreground text-sm font-semibold">Notifications</SheetTitle>
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
          <SheetDescription className="sr-only">
            View and manage your notifications
          </SheetDescription>
        </SheetHeader>

        {/* Notification list */}
        <ScrollArea className="h-full flex-1">
          {loading ?
            <div className="space-y-4 p-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="space-y-3"
                >
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          : notifications.length === 0 ?
            <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
              <Bell className="text-muted-foreground mb-4 h-16 w-16 opacity-50" />
              <p className="text-muted-foreground text-base font-medium">No notifications</p>
              <p className="text-muted-foreground mt-2 text-sm">You're all caught up!</p>
            </div>
          : <ul className="py-0">
              {notifications.map((notification, index) => (
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
                        <h4 className="text-foreground text-sm font-medium">
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

        {/* Footer with "View all" - sticky at bottom */}
        {notifications.length > 0 && (
          <div className="border-border bg-background border-t p-4">
            <Button
              variant="outline"
              size="lg"
              onClick={handleViewAll}
              className="min-h-[44px] w-full"
            >
              View all notifications
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export const NotificationBellMobile = memo(NotificationBellMobileComponent);
NotificationBellMobile.displayName = 'NotificationBellMobile';
