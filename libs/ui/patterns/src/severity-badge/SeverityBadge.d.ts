/**
 * SeverityBadge Component
 * Displays log severity with color-coded visual indicators
 * Epic 0.8: System Logs - Story 0.8.3
 */
import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
import type { LogSeverity } from '@nasnet/core/types';
/**
 * Severity badge variants with color mapping
 * - debug: Gray (low priority, muted)
 * - info: Blue (informational)
 * - warning: Amber/Yellow (attention needed)
 * - error: Red (error occurred)
 * - critical: Red Bold (critical issue)
 *
 * Colors meet WCAG AA contrast requirements
 */
declare const severityBadgeVariants: (props?: ({
    severity?: "error" | "warning" | "info" | "critical" | "debug" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
export interface SeverityBadgeProps extends VariantProps<typeof severityBadgeVariants>, Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
    /**
     * Log severity level
     */
    severity: LogSeverity;
    /**
     * Optional callback when badge is dismissed (for filter badges)
     * If provided, a dismiss button (X) will be shown
     */
    onRemove?: () => void;
}
/**
 * SeverityBadge Component
 *
 * Displays a color-coded badge for log severity levels.
 * Used in both log entries and filter badges.
 *
 * @example
 * ```tsx
 * // In log entry (no remove button)
 * <SeverityBadge severity="error" />
 *
 * // In filter area (with remove button)
 * <SeverityBadge
 *   severity="warning"
 *   onRemove={() => removeSeverity('warning')}
 * />
 * ```
 */
declare function SeverityBadgeBase({ severity, onRemove, className, ...props }: SeverityBadgeProps): import("react/jsx-runtime").JSX.Element;
export declare const SeverityBadge: React.MemoExoticComponent<typeof SeverityBadgeBase>;
export {};
//# sourceMappingURL=SeverityBadge.d.ts.map