/**
 * useAlertNotifications Hook
 *
 * @description Subscribes to real-time alert events via GraphQL subscription
 * and manages in-app notifications with Zustand store integration, toast
 * notifications with severity-based styling, sound playback, and contextual
 * navigation hints. Respects user settings for enabled state, severity filter,
 * and sound preferences.
 *
 * Features:
 * - GraphQL subscription to alertEvents
 * - Automatic Zustand store integration
 * - Toast notifications with severity-based styling
 * - Sound playback for critical/warning/info alerts
 * - Respects user settings (enabled, severity filter, sound)
 * - Navigation hints for contextual alerts
 *
 * Task #3: Apollo Client subscription hook integration
 */
import { type AlertSeverity } from '@nasnet/state/stores';
/**
 * Hook options
 */
export interface UseAlertNotificationsOptions {
    /**
     * Override device ID (defaults to activeRouterId from connection store)
     */
    deviceId?: string;
    /**
     * Whether to enable the subscription (default: true)
     */
    enabled?: boolean;
}
/**
 * Play alert sound based on severity
 */
declare function playAlertSound(severity: AlertSeverity, soundEnabled: boolean): void;
/**
 * useAlertNotifications Hook
 *
 * @description Subscribes to real-time alert events and integrates with
 * Alert notification store (Zustand), Toast notifications (Sonner), and
 * Sound playback. Cleans up subscription on unmount.
 *
 * @example
 * ```tsx
 * function AppLayout() {
 *   // Enable subscription globally
 *   useAlertNotifications();
 *
 *   return <Outlet />;
 * }
 * ```
 *
 * @example
 * ```tsx
 * function DashboardPage() {
 *   const router = useActiveRouter();
 *
 *   // Subscribe only to alerts for this router
 *   useAlertNotifications({
 *     deviceId: router?.id,
 *     enabled: !!router,
 *   });
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export declare function useAlertNotifications(options?: UseAlertNotificationsOptions): void;
/**
 * Export sound playback helper for testing and external use
 */
export { playAlertSound };
//# sourceMappingURL=useAlertNotifications.d.ts.map