/**
 * Interface Grid Types
 *
 * This module extends the base RouterInterface type from the interface-selector pattern
 * with dashboard-specific fields for real-time monitoring and traffic display.
 */
import type { RouterInterface, InterfaceType, InterfaceStatus } from '@nasnet/ui/patterns/network-inputs/interface-selector';
export type { InterfaceType, InterfaceStatus };
/**
 * Extended interface data for dashboard grid display.
 * Adds traffic rates, link speed, and other dashboard-specific fields.
 */
export interface InterfaceGridData extends RouterInterface {
    /** Transmit rate in bits per second */
    txRate: number;
    /** Receive rate in bits per second */
    rxRate: number;
    /** Link speed (e.g., "1Gbps", "100Mbps") */
    linkSpeed?: string;
    /** Maximum transmission unit */
    mtu: number;
    /** Whether interface is operationally running */
    running: boolean;
    /** ISO timestamp of last seen (for downed interfaces) */
    lastSeen?: string;
    /** Link partner information (for connected interfaces) */
    linkPartner?: string;
}
/**
 * Props for InterfaceDetailSheet component.
 */
export interface InterfaceDetailSheetProps {
    /** Interface to display details for */
    interface: InterfaceGridData | null;
    /** Whether the sheet/dialog is open */
    open: boolean;
    /** Callback when open state changes */
    onOpenChange: (open: boolean) => void;
}
/**
 * Props for InterfaceGrid component.
 */
export interface InterfaceGridProps {
    /** Device ID to fetch interfaces for */
    deviceId: string;
    /** Additional CSS classes */
    className?: string;
}
/**
 * Props for InterfaceStatusCard component.
 */
export interface InterfaceStatusCardProps {
    /** Interface data to display */
    interface: InterfaceGridData;
    /** Callback when card is clicked */
    onSelect: (iface: InterfaceGridData) => void;
    /** Additional CSS classes */
    className?: string;
}
//# sourceMappingURL=types.d.ts.map