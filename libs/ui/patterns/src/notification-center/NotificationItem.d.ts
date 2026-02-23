/**
 * NotificationItem Component
 *
 * Displays a single notification with severity icon, title, message, and timestamp.
 * Shows an unread indicator dot for unread notifications.
 */
import type { NotificationItemProps } from './types';
/**
 * NotificationItem - Single notification display
 *
 * Features:
 * - Severity icon with appropriate color
 * - Title and message text
 * - Relative timestamp (e.g., "5 minutes ago")
 * - Unread indicator dot
 * - Click to navigate and mark as read
 * - Hover state
 */
declare function NotificationItemComponent({ notification, onClick, className, }: NotificationItemProps): import("react/jsx-runtime").JSX.Element;
export declare const NotificationItem: import("react").MemoExoticComponent<typeof NotificationItemComponent>;
export {};
//# sourceMappingURL=NotificationItem.d.ts.map