/**
 * WirelessInterfaceCard Component
 * Displays a single wireless interface with status, SSID, band, and client count
 * Follows card-based UI pattern from UX design specification
 */
import * as React from 'react';
import type { WirelessInterface } from '@nasnet/core/types';
export interface WirelessInterfaceCardProps {
    /** Wireless interface data */
    interface: WirelessInterface;
    /** Optional click handler for card interaction */
    onClick?: () => void;
    /** Optional className for styling overrides */
    className?: string;
}
export declare const WirelessInterfaceCard: React.MemoExoticComponent<React.ForwardRefExoticComponent<WirelessInterfaceCardProps & React.RefAttributes<HTMLDivElement>>>;
//# sourceMappingURL=WirelessInterfaceCard.d.ts.map