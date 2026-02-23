/**
 * QueuedAlertBadge Component
 *
 * Displays badge for alerts queued due to quiet hours or bypassed critical alerts.
 * Shows delivery time countdown and visual distinction for critical overrides.
 *
 * @description Per Task #9: Add queued alert status display
 * @example
 * // Queued alert
 * <QueuedAlertBadge queuedUntil="2026-02-13T08:00:00Z" />
 *
 * // Bypassed quiet hours
 * <QueuedAlertBadge bypassedQuietHours={true} />
 *
 * @see useAlertQueue
 */
/**
 * @interface QueuedAlertBadgeProps
 * @description Props for QueuedAlertBadge component
 */
interface QueuedAlertBadgeProps {
    /** ISO 8601 timestamp when alert will be delivered */
    queuedUntil?: string;
    /** Whether alert bypassed quiet hours (critical severity) */
    shouldBypassQuietHours?: boolean;
    /** Optional CSS className for custom styling */
    className?: string;
}
/**
 * Badge showing alert queuing status and delivery timing.
 * Handles two cases: queued alerts (show countdown) and bypassed critical alerts.
 * Hides when no queuing info present.
 *
 * @component
 * @example
 * return <QueuedAlertBadge queuedUntil="2026-02-13T08:00:00Z" />;
 */
declare const QueuedAlertBadge: {
    ({ queuedUntil, shouldBypassQuietHours, className, }: QueuedAlertBadgeProps): import("react/jsx-runtime").JSX.Element | null;
    displayName: string;
};
export { QueuedAlertBadge };
export type { QueuedAlertBadgeProps };
//# sourceMappingURL=QueuedAlertBadge.d.ts.map