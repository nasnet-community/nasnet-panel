/**
 * @interface AlertBadgeProps
 * @description Props for AlertBadge component
 */
interface AlertBadgeProps {
    /** Optional device/router ID for scoped alert count */
    deviceId?: string;
    /** Optional className for custom styling */
    className?: string;
}
/**
 * Badge showing count of unacknowledged alerts.
 * Hides when count is 0. Shows "99+" for counts above 99.
 * Accessible: aria-label describes the count to screen readers.
 *
 * @component
 * @example
 * return <AlertBadge deviceId="router-1" />;
 */
declare const AlertBadge: {
    ({ deviceId, className }: AlertBadgeProps): import("react/jsx-runtime").JSX.Element | null;
    displayName: string;
};
export { AlertBadge };
export type { AlertBadgeProps };
//# sourceMappingURL=AlertBadge.d.ts.map