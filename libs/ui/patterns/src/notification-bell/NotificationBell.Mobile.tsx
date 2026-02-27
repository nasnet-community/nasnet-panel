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
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
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
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="h-[85vh] p-0"
        role="dialog"
        aria-label="Notifications"
      >
        <SheetHeader className="border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-sm font-semibold text-foreground">
              Notifications
            </SheetTitle>
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
          <SheetDescription className="sr-only">
            View and manage your notifications
          </SheetDescription>
        </SheetHeader>

        {/* Notification list */}
        <ScrollArea className="flex-1 h-full">
          {loading ? (
            <div className="p-4 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <Bell className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
              <p className="text-base text-muted-foreground font-medium">
                No notifications
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                You're all caught up!
              </p>
            </div>
          ) : (
            <ul className="py-0">
              {notifications.map((notification, index) => (
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
                        <h4 className="text-sm font-medium text-foreground">
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

        {/* Footer with "View all" - sticky at bottom */}
        {notifications.length > 0 && (
          <div className="border-t border-border p-4 bg-background">
            <Button
              variant="outline"
              size="lg"
              onClick={handleViewAll}
              className="w-full min-h-[44px]"
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
