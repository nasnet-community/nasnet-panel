/**
 * DeviceIcon
 *
 * SVG icon representing a device on the network.
 * Supports multiple device types with distinct icons.
 */
export type DeviceType = 'computer' | 'phone' | 'tablet' | 'iot' | 'unknown';
export interface DeviceIconProps {
    /** Size of the icon in pixels */
    size?: number;
    /** Type of device */
    type?: DeviceType;
    /** Device status for styling */
    status?: 'online' | 'offline';
    /** Additional CSS classes */
    className?: string;
    /** Accessible label */
    'aria-label'?: string;
}
/**
 * Device icon for network topology visualization.
 * Displays different icons based on device type.
 */
export declare const DeviceIcon: import("react").NamedExoticComponent<DeviceIconProps>;
//# sourceMappingURL=DeviceIcon.d.ts.map