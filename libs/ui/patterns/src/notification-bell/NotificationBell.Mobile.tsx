/**
 * NotificationBell Mobile Presenter
 *
 * Mobile-optimized notification bell using Sheet (bottom drawer) for full-screen notifications.
 * Touch-friendly with large tap targets and simplified layout.
 */

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
export function NotificationBellMobile(props: NotificationBellProps) {
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
          size="sm"
          className={cn('relative min-w-[44px] min-h-[44px]', className)}
          aria-label={`Notifications (${unreadCount} unread)`}
          aria-live="polite"
          aria-atomic="true"
        >
          <Bell className="h-6 w-6" />
          {showBadge && (
            <Badge
              variant="error"
              className="absolute -top-1 -right-1 h-5 min-w-[20px] rounded-full px-1 text-xs font-semibold"
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
        <SheetHeader className="border-b border-border px-4 py-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold">
              Notifications
            </SheetTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                className="h-auto py-1 text-xs"
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
            <div className="py-2">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <button
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'w-full text-left px-4 py-4 min-h-[88px] active:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset',
                      !notification.read && 'bg-primary/5'
                    )}
                    tabIndex={0}
                    aria-label={`${notification.title} - ${notification.message}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Unread indicator - larger on mobile */}
                      {!notification.read && (
                        <div
                          className="mt-2 h-3 w-3 rounded-full bg-primary flex-shrink-0"
                          aria-label="Unread"
                        />
                      )}

                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Severity badge */}
                        <Badge
                          variant={getSeverityVariant(notification.severity)}
                          className="text-xs"
                        >
                          {notification.severity}
                        </Badge>

                        {/* Title */}
                        <h4 className="text-base font-medium leading-tight">
                          {notification.title}
                        </h4>

                        {/* Message */}
                        <p className="text-sm text-muted-foreground line-clamp-3">
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
                  {index < notifications.length - 1 && <Separator />}
                </div>
              ))}
            </div>
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

NotificationBellMobile.displayName = 'NotificationBell.Mobile';
