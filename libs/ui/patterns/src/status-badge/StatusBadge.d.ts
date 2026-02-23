/**
 * Status Badge Component
 * Displays status with color-coded badge
 * Epic 0.5: DHCP Management - Story 0.5.2
 *
 * @module @nasnet/ui/patterns/status-badge
 * @example
 * ```tsx
 * <StatusBadge status="bound" />
 * <StatusBadge status="waiting" label="Pending" />
 * ```
 */
import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
import type { LeaseStatus, DHCPClientStatus } from '@nasnet/core/types';
declare const badgeVariants: (props?: ({
    variant?: "default" | "static" | "bound" | "waiting" | "busy" | "offered" | "searching" | "requesting" | "stopped" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
/**
 * StatusBadge component props
 */
export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
    /** Status value (DHCP lease status, client status, or static) */
    status?: LeaseStatus | DHCPClientStatus | 'static';
    /** Optional custom label (overrides default status label) */
    label?: string;
}
/**
 * Memoized StatusBadge to prevent unnecessary re-renders
 * Only re-renders when props actually change
 */
export declare const StatusBadge: React.MemoExoticComponent<React.ForwardRefExoticComponent<StatusBadgeProps & React.RefAttributes<HTMLSpanElement>>>;
/**
 * Badge variant styles from CVA
 * Exported for external use in other components
 */
export { badgeVariants };
//# sourceMappingURL=StatusBadge.d.ts.map