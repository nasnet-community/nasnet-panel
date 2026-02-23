/**
 * Status Pills Component
 * Horizontal scrollable pill badges for quick status indicators
 * Based on UX Design Specification - Direction 4: Action-First
 *
 * @module @nasnet/ui/patterns/status-pills
 * @example
 * ```tsx
 * <StatusPills
 *   pills={[
 *     { id: 'vpn', label: 'VPN Active', variant: 'success' },
 *     { id: 'cpu', label: 'CPU 82%', variant: 'warning' },
 *   ]}
 * />
 * ```
 */
import * as React from 'react';
import { type LucideIcon } from 'lucide-react';
/**
 * Status pill variant
 */
export type StatusPillVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'loading';
/**
 * Status pill configuration
 */
export interface StatusPill {
    /** Unique identifier for the pill */
    id: string;
    /** Display label */
    label: string;
    /** Status variant (determines icon and colors) */
    variant: StatusPillVariant;
    /** Optional icon override (replaces default icon for variant) */
    icon?: LucideIcon;
    /** Optional click handler - makes pill interactive when provided */
    onClick?: () => void;
}
/**
 * StatusPills component props
 */
export interface StatusPillsProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Array of status pills to render */
    pills: StatusPill[];
}
/**
 * Memoized StatusPills component
 * Prevents unnecessary re-renders when props don't change
 */
export declare const StatusPills: React.MemoExoticComponent<React.ForwardRefExoticComponent<StatusPillsProps & React.RefAttributes<HTMLDivElement>>>;
//# sourceMappingURL=StatusPills.d.ts.map