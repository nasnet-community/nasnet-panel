/**
 * @interface AlertListProps
 * @description Props for AlertList component
 */
export interface AlertListProps {
    /** Filter alerts by device ID */
    deviceId?: string;
    /** Filter alerts by severity level */
    severity?: 'CRITICAL' | 'WARNING' | 'INFO';
    /** Filter by acknowledgment status */
    shouldShowAcknowledged?: boolean;
    /** Maximum number of alerts to display */
    limit?: number;
}
/**
 * Alert list with severity color coding, timestamps, and inline actions.
 * Supports real-time updates via subscription. Shows empty state when no alerts.
 * Loading and error states handled gracefully.
 *
 * @component
 * @example
 * return <AlertList severity="CRITICAL" shouldShowAcknowledged={false} />;
 */
export declare const AlertList: import("react").NamedExoticComponent<AlertListProps>;
//# sourceMappingURL=AlertList.d.ts.map