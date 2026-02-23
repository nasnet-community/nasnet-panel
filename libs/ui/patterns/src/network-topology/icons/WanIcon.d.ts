/**
 * WanIcon
 *
 * SVG icon representing a WAN (Wide Area Network) interface.
 * Uses --color-wan design token for styling.
 */
export interface WanIconProps {
    /** Size of the icon in pixels */
    size?: number;
    /** Connection status for styling */
    status?: 'connected' | 'disconnected' | 'pending';
    /** Additional CSS classes */
    className?: string;
    /** Accessible label */
    'aria-label'?: string;
}
/**
 * WAN interface icon representing internet/external network connection.
 * Displays as a globe/cloud icon with status-based coloring.
 */
export declare const WanIcon: import("react").NamedExoticComponent<WanIconProps>;
//# sourceMappingURL=WanIcon.d.ts.map