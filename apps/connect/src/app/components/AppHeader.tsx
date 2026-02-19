import { useNavigate } from '@tanstack/react-router';
import { MoreVertical } from 'lucide-react';

import { useConnectionStore, useAlertNotificationStore, useUnreadCount, useNotifications } from '@nasnet/state/stores';
import type { InAppNotification } from '@nasnet/state/stores';
import { ThemeToggle, NotificationBell } from '@nasnet/ui/patterns';
import { Button } from '@nasnet/ui/primitives';



/**
 * AppHeader Component
 *
 * Dashboard Pro design header with brand identity and connection status.
 * Matches Design Direction 3 from ux-design-directions.html
 *
 * Features:
 * - Professional monitoring aesthetic
 * - Brand logo with app identity
 * - Real-time connection status display
 * - Theme toggle and settings access
 */
export function AppHeader() {
  const { state, currentRouterIp } = useConnectionStore();
  const navigate = useNavigate();

  // Get notification data from store
  const unreadCount = useUnreadCount();
  const allNotifications = useNotifications();
  const recentNotifications = allNotifications.slice(0, 5); // Show 5 most recent

  // Get store actions
  const markAsRead = useAlertNotificationStore((s) => s.markAsRead);
  const markAllRead = useAlertNotificationStore((s) => s.markAllRead);

  // Handler: Click notification -> mark as read + navigate to dashboard
  const handleNotificationClick = (notification: InAppNotification) => {
    markAsRead(notification.id);

    // Navigate to dashboard (alerts will be shown there)
    navigate({ to: '/dashboard' });
  };

  // Handler: Mark all notifications as read
  const handleMarkAllRead = () => {
    markAllRead();
  };

  // Handler: View all notifications page
  const handleViewAll = () => {
    navigate({ to: '/dashboard' });
  };

  // Determine status display based on connection state
  const getStatusConfig = () => {
    switch (state) {
      case 'connected':
        return {
          text: 'Online',
          dotClass: 'bg-green-500',
          textClass: 'text-green-500 dark:text-green-400',
        };
      case 'reconnecting':
        return {
          text: 'Reconnecting',
          dotClass: 'bg-amber-500 animate-pulse',
          textClass: 'text-amber-500 dark:text-amber-400',
        };
      case 'disconnected':
      default:
        return {
          text: 'Offline',
          dotClass: 'bg-red-500',
          textClass: 'text-red-500 dark:text-red-400',
        };
    }
  };

  const statusConfig = getStatusConfig();

  // Display router IP when connected, otherwise show app name
  const displayName = currentRouterIp && state === 'connected' 
    ? currentRouterIp 
    : 'NasNetConnect';

  return (
    <div className="flex h-full items-center justify-between px-4 py-3">
      {/* Left: Brand + Status */}
      <div className="flex items-center gap-3">
        {/* Logo */}
        <img 
          src="/favicon.png" 
          alt="NasNet" 
          className="w-8 h-8 rounded-lg shadow-sm"
        />

        {/* App/Router Info */}
        <div>
          <p className="text-sm font-medium text-foreground">
            {displayName}
          </p>
          <p className={`text-xs flex items-center gap-1.5 ${statusConfig.textClass}`}>
            <span 
              className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotClass}`} 
              aria-hidden="true"
            />
            {statusConfig.text}
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <NotificationBell
          unreadCount={unreadCount}
          notifications={recentNotifications}
          onNotificationClick={handleNotificationClick}
          onMarkAllRead={handleMarkAllRead}
          onViewAll={handleViewAll}
        />
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full min-h-[44px] min-w-[44px]"
          aria-label="More options"
        >
          <MoreVertical className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
