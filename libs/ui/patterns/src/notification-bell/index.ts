/**
 * NotificationBell Pattern Component
 *
 * In-app notification bell with platform presenters.
 * Auto-detects platform and renders optimal UI.
 */

export { NotificationBell } from './NotificationBell';
export { NotificationBellDesktop } from './NotificationBell.Desktop';
export { NotificationBellMobile } from './NotificationBell.Mobile';
export { useNotificationBell } from './useNotificationBell';

export type { NotificationBellProps, NotificationBellState } from './types';
