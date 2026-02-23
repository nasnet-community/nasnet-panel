/**
 * TopologyTooltip
 *
 * Tooltip component for displaying node details in the network topology.
 * Built on Radix Tooltip primitive for accessibility.
 */
import { type ReactNode } from 'react';
import type { TooltipContent as TooltipData } from './types';
export interface TopologyTooltipProps {
    /** Child element that triggers the tooltip */
    children: ReactNode;
    /** Tooltip content data */
    content: TooltipData | null;
    /** Whether the tooltip is open (controlled) */
    open?: boolean;
    /** Callback when open state changes */
    onOpenChange?: (open: boolean) => void;
    /** Side of the trigger to render tooltip */
    side?: 'top' | 'right' | 'bottom' | 'left';
    /** Alignment of the tooltip */
    align?: 'start' | 'center' | 'end';
    /** Delay before showing tooltip in ms */
    delayDuration?: number;
    /** Additional CSS classes for content */
    className?: string;
}
/**
 * TopologyTooltip displays detailed information about a topology node.
 *
 * Features:
 * - Shows title, IP address, and status
 * - Displays additional details in a key-value format
 * - Accessible via keyboard focus
 * - Avoids viewport overflow
 */
export declare const TopologyTooltip: import("react").NamedExoticComponent<TopologyTooltipProps>;
/**
 * TopologyTooltipContent
 *
 * Standalone content component for use in custom tooltip implementations.
 */
export declare const TopologyTooltipContent: import("react").NamedExoticComponent<{
    content: TooltipData;
    className?: string;
}>;
//# sourceMappingURL=TopologyTooltip.d.ts.map