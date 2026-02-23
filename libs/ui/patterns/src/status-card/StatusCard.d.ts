/**
 * Status Card Component
 * Hero dashboard component showing overall network health
 * Based on UX Design Specification - Direction 1: Clean Minimal
 *
 * @module @nasnet/ui/patterns/status-card
 * @example
 * ```tsx
 * <StatusCard
 *   status="healthy"
 *   message="Network Healthy"
 *   subtitle="All systems operational"
 *   metrics={[
 *     { value: 12, label: 'Interfaces' },
 *     { value: '99.8', label: 'Uptime', unit: '%' },
 *   ]}
 * />
 * ```
 */
import * as React from 'react';
/**
 * Network health status types
 */
export type NetworkStatus = 'healthy' | 'warning' | 'error' | 'loading';
/**
 * Metric data for the status card
 */
export interface StatusMetric {
    /** Metric value (string or number) */
    value: string | number;
    /** Metric label */
    label: string;
    /** Optional unit (e.g., '%', 'ms') */
    unit?: string;
}
/**
 * StatusCard component props
 */
export interface StatusCardProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Overall network health status */
    status: NetworkStatus;
    /** Status message/title displayed with indicator dot */
    message: string;
    /** Array of metrics to display in grid (typically 3) */
    metrics?: StatusMetric[];
    /** Optional subtitle/description shown above message */
    subtitle?: string;
    /** Optional click handler - adds cursor-pointer and hover effect when provided */
    onClick?: () => void;
}
/**
 * Memoized StatusCard component
 * Prevents unnecessary re-renders when props don't change
 */
export declare const StatusCard: React.MemoExoticComponent<React.ForwardRefExoticComponent<StatusCardProps & React.RefAttributes<HTMLDivElement>>>;
//# sourceMappingURL=StatusCard.d.ts.map