/**
 * Wireless Interface Detail Component
 * @description Displays comprehensive wireless interface configuration including radio settings,
 * security profile, signal strength, and regional settings with edit capabilities.
 * Implements FR0-15: View wireless interface configuration details
 * Implements FR0-16: View security profile settings
 */
import type { WirelessInterfaceDetail as WirelessInterfaceDetailType } from '@nasnet/core/types';
export interface WirelessInterfaceDetailProps {
    /** The wireless interface to display */
    interface: WirelessInterfaceDetailType;
    /** Optional CSS className */
    className?: string;
}
/**
 * Wireless Interface Detail Component
 * Shows full configuration details including radio settings, hardware info, and status
 */
export declare const WirelessInterfaceDetail: import("react").ForwardRefExoticComponent<WirelessInterfaceDetailProps & import("react").RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=WirelessInterfaceDetail.d.ts.map