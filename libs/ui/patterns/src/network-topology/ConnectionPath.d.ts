/**
 * ConnectionPath
 *
 * SVG path component for rendering connections between topology nodes.
 * Implements curved bezier paths with status-based styling.
 */
export interface ConnectionPathProps {
    /** SVG path data (d attribute) */
    path: string;
    /** Connection status for styling */
    status: 'connected' | 'disconnected' | 'pending';
    /** Unique ID for the connection */
    id?: string;
    /** Additional CSS classes */
    className?: string;
    /** Whether to animate the path (for pending status) */
    animate?: boolean;
}
/**
 * ConnectionPath renders a curved line between two topology nodes.
 *
 * Styling rules:
 * - Connected: Solid line with connection color
 * - Disconnected: Dashed line with muted color
 * - Pending: Animated dashed line with warning color
 */
export declare const ConnectionPath: import("react").NamedExoticComponent<ConnectionPathProps>;
/**
 * ConnectionPathStatic
 *
 * Static version without animations for reduced motion preference.
 */
export declare const ConnectionPathStatic: import("react").NamedExoticComponent<Omit<ConnectionPathProps, "animate">>;
//# sourceMappingURL=ConnectionPath.d.ts.map