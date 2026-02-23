/**
 * NotificationCenterMobile Component
 *
 * Mobile presenter for notification center (full-screen Sheet).
 * Optimized for touch with 44px touch targets and bottom action bar.
 */
import type { NotificationCenterProps } from './types';
/**
 * NotificationCenterMobile - Full-screen sheet for mobile
 *
 * Features:
 * - Full-screen sheet with 44px touch targets
 * - Header with title and close button
 * - Severity filter buttons (44px height)
 * - Scrollable notification list
 * - Bottom action bar with "Mark all read" and "Clear" buttons
 * - Empty state when no notifications
 */
declare function NotificationCenterMobileComponent({ open, onClose, className, }: NotificationCenterProps): import("react/jsx-runtime").JSX.Element;
export declare const NotificationCenterMobile: import("react").MemoExoticComponent<typeof NotificationCenterMobileComponent>;
export {};
//# sourceMappingURL=NotificationCenterMobile.d.ts.map