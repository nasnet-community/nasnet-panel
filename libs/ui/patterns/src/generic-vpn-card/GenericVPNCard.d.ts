/**
 * GenericVPNCard Component
 *
 * Displays generic VPN interface information (L2TP, PPTP, SSTP).
 * Story 0-4-4: Other VPN Type Viewer.
 *
 * @example
 * ```tsx
 * <GenericVPNCard vpnInterface={l2tpInterface} />
 * ```
 */
import React from 'react';
import type { VPNInterface } from '@nasnet/core/types';
export interface GenericVPNCardProps {
    /** VPN interface data */
    vpnInterface: VPNInterface;
    /** Optional click handler */
    onClick?: () => void;
}
/**
 * Generic VPN Card Component
 * Displays VPN interface name, type, status, and remote address
 * Supports L2TP, PPTP, and SSTP protocols
 *
 * @example
 * ```tsx
 * <GenericVPNCard vpnInterface={l2tpInterface} />
 * ```
 */
declare function GenericVPNCardComponent({ vpnInterface, onClick }: GenericVPNCardProps): import("react/jsx-runtime").JSX.Element;
export declare const GenericVPNCard: React.MemoExoticComponent<typeof GenericVPNCardComponent>;
export {};
//# sourceMappingURL=GenericVPNCard.d.ts.map