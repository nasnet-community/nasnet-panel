/**
 * Resource Gauge Component
 * Visual gauge for displaying resource usage (CPU, Memory, Disk) with color-coded status
 *
 * Features:
 * - Circular SVG gauge with animated fill
 * - Color-coded status (healthy, warning, critical)
 * - Centered percentage label
 * - Optional subtitle
 * - Loading skeleton
 * - WCAG AA accessible
 * - Semantic color tokens
 *
 * @example
 * ```tsx
 * <ResourceGauge label="CPU" value={45} status="healthy" />
 * <ResourceGauge label="Memory" value={78} status="warning" subtitle="39 MB / 50 MB" />
 * <ResourceGauge label="Disk" value={92} status="critical" isLoading={false} />
 * ```
 */
import * as React from 'react';
import type { ResourceStatus } from '@nasnet/core/types';
/**
 * ResourceGauge Props
 */
export interface ResourceGaugeProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Resource label (e.g., "CPU", "Memory", "Disk") */
    label: string;
    /** Current usage value (0-100) */
    value?: number;
    /** Resource status (healthy, warning, critical) */
    status?: ResourceStatus;
    /** Loading state */
    isLoading?: boolean;
    /** Optional subtitle/description */
    subtitle?: string;
}
/**
 * ResourceGauge Component
 * Displays resource usage with color-coded progress bar and percentage
 */
declare function ResourceGaugeBase({ label, value, status, isLoading, subtitle, className, ...props }: ResourceGaugeProps): import("react/jsx-runtime").JSX.Element;
export declare const ResourceGauge: React.MemoExoticComponent<typeof ResourceGaugeBase>;
export {};
//# sourceMappingURL=ResourceGauge.d.ts.map