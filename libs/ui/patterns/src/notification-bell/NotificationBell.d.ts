/**
 * NotificationBell Pattern Component
 *
 * Auto-detecting wrapper that selects the appropriate platform presenter.
 * Implements the Headless + Platform Presenters pattern from ADR-018.
 *
 * @example
 * ```tsx
 * <NotificationBell
 *   unreadCount={5}
 *   notifications={recentNotifications}
 *   onNotificationClick={(n) => navigate(`/alerts/${n.alertId}`)}
 *   onMarkAllRead={() => markAllAsRead()}
 *   onViewAll={() => navigate('/notifications')}
 * />
 * ```
 */
import type { NotificationBellProps } from './types';
/**
 * NotificationBell - In-app notification bell with unread count badge
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile (<640px): Full-screen Sheet (bottom drawer) with large touch targets
 * - Tablet/Desktop (>=640px): Compact Popover with notification preview
 *
 * Features:
 * - Unread count badge (shows "9+" for 10+)
 * - Notification preview with recent alerts
 * - Quick actions: Mark all read, View all
 * - WCAG AAA accessible with ARIA labels and keyboard navigation
 */
declare function NotificationBellComponent(props: NotificationBellProps): import("react/jsx-runtime").JSX.Element;
export declare const NotificationBell: import("react").MemoExoticComponent<typeof NotificationBellComponent>;
export {};
//# sourceMappingURL=NotificationBell.d.ts.map