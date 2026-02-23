/**
 * Connection Event Card Component
 *
 * Display individual WAN connection events in a timeline format with visual
 * status indicators, timestamps, and event-specific details (IP, gateway, reason).
 *
 * Includes both full and compact presentations for different viewport contexts.
 *
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 6: Connection History)
 */
import type { ConnectionEventData } from '../../types/wan.types';
export interface ConnectionEventCardProps {
    /** Connection event data to display */
    event: ConnectionEventData;
    /** Show WAN interface ID in the header (default: true) */
    showInterface?: boolean;
    /** Additional CSS classes */
    className?: string;
}
/**
 * Connection Event Card - Timeline item for connection events
 *
 * Displays a single connection event with visual timeline indicator, timestamp,
 * and event-specific details. Uses semantic color tokens based on event type.
 */
declare function ConnectionEventCardComponent({ event, showInterface, className, }: ConnectionEventCardProps): import("react/jsx-runtime").JSX.Element;
export declare const ConnectionEventCard: typeof ConnectionEventCardComponent & {
    displayName: string;
};
/**
 * Compact version for mobile/narrow views
 *
 * Condensed layout optimized for small viewports, omitting timeline connector
 * and reducing detail visibility while maintaining essential information.
 */
declare function ConnectionEventCardCompactComponent({ event, showInterface, className, }: ConnectionEventCardProps): import("react/jsx-runtime").JSX.Element;
export declare const ConnectionEventCardCompact: typeof ConnectionEventCardCompactComponent & {
    displayName: string;
};
export {};
//# sourceMappingURL=ConnectionEventCard.d.ts.map