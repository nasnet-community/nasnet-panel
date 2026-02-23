/**
 * VPN Clients Summary Component
 * Summary card showing connected VPN client count with expandable list
 * Based on UX Design Specification - Direction 4: Action-First
 *
 * @example
 * ```tsx
 * <VPNClientsSummary
 *   connectedCount={3}
 *   clients={vpnClients}
 *   linkTo="/vpn"
 * />
 * ```
 */
import React from 'react';
import type { VPNProtocol } from '@nasnet/core/types';
/**
 * Connected VPN client info
 */
export interface ConnectedVPNClient {
    /** Client ID */
    id: string;
    /** Client/user name */
    name: string;
    /** VPN protocol */
    protocol: VPNProtocol;
    /** Remote IP address */
    remoteAddress?: string;
    /** Local/assigned IP address */
    localAddress?: string;
    /** Connection uptime */
    uptime?: string;
}
/**
 * VPNClientsSummary Props
 */
export interface VPNClientsSummaryProps {
    /** Total connected clients count */
    connectedCount: number;
    /** List of connected clients (show top 3-5) */
    clients?: ConnectedVPNClient[];
    /** Whether data is loading */
    isLoading?: boolean;
    /** Link to full VPN page */
    linkTo?: string;
    /** Maximum clients to show in collapsed view */
    maxVisible?: number;
    /** Custom className */
    className?: string;
}
/**
 * VPNClientsSummary Component
 * Shows VPN client summary with connected count and expandable client list
 */
declare function VPNClientsSummaryComponent({ connectedCount, clients, isLoading, linkTo, maxVisible, className, }: VPNClientsSummaryProps): import("react/jsx-runtime").JSX.Element;
export declare const VPNClientsSummary: React.MemoExoticComponent<typeof VPNClientsSummaryComponent>;
export {};
//# sourceMappingURL=VPNClientsSummary.d.ts.map