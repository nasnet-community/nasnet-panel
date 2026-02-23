/**
 * ConnectionStateBadge Component
 *
 * Badge displaying connection state with semantic colors.
 * Supports all 11 MikroTik connection states.
 */
import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
import type { ConnectionState } from './types';
declare const connectionStateBadgeVariants: (props?: ({
    variant?: "established" | "new" | "related" | "invalid" | "time-wait" | "syn-sent" | "syn-received" | "fin-wait" | "close-wait" | "last-ack" | "close" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
export interface ConnectionStateBadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof connectionStateBadgeVariants> {
    /** Connection state */
    state: ConnectionState;
    /** Custom label (defaults to formatted state) */
    label?: string;
}
/**
 * Memoized ConnectionStateBadge to prevent unnecessary re-renders
 */
export declare const ConnectionStateBadge: React.MemoExoticComponent<React.ForwardRefExoticComponent<ConnectionStateBadgeProps & React.RefAttributes<HTMLSpanElement>>>;
export { connectionStateBadgeVariants };
//# sourceMappingURL=ConnectionStateBadge.d.ts.map