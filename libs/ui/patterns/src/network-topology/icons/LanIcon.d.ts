/**
 * LanIcon
 *
 * SVG icon representing a LAN (Local Area Network).
 * Uses --color-lan design token for styling.
 */
export interface LanIconProps {
    /** Size of the icon in pixels */
    size?: number;
    /** Connection status for styling */
    status?: 'connected' | 'disconnected';
    /** Number of devices on this network (optional) */
    deviceCount?: number;
    /** Additional CSS classes */
    className?: string;
    /** Accessible label */
    'aria-label'?: string;
}
/**
 * LAN network icon representing a local network segment.
 * Displays as a network/nodes icon with status-based coloring.
 */
export declare const LanIcon: import("react").NamedExoticComponent<LanIconProps>;
//# sourceMappingURL=LanIcon.d.ts.map