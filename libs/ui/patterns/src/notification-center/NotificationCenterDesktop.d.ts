/**
 * NotificationCenterDesktop Component
 *
 * Desktop presenter for notification center (400px side panel).
 * Displays notifications in a scrollable list with severity filters.
 */
import type { NotificationCenterProps } from './types';
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
declare function NotificationCenterDesktopComponent({ open, onClose, className, }: NotificationCenterProps): import("react/jsx-runtime").JSX.Element;
export declare const NotificationCenterDesktop: import("react").MemoExoticComponent<typeof NotificationCenterDesktopComponent>;
export {};
//# sourceMappingURL=NotificationCenterDesktop.d.ts.map