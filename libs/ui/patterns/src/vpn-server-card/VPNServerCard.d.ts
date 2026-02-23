/**
 * VPN Server Card Component
 *
 * Displays a VPN server with status, port, connections, and actions.
 * Supports all VPN protocols.
 *
 * @example
 * ```tsx
 * <VPNServerCard
 *   id="1"
 *   name="WireGuard Server"
 *   protocol="wireguard"
 *   isDisabled={false}
 *   isRunning={true}
 * />
 * ```
 */
import type { VPNProtocol } from '@nasnet/core/types';
export interface VPNServerCardProps {
    /** Server ID */
    id: string;
    /** Server name */
    name: string;
    /** VPN protocol */
    protocol: VPNProtocol;
    /** Server enabled/disabled */
    isDisabled: boolean;
    /** Server running state */
    isRunning: boolean;
    /** Listening port */
    port?: number;
    /** Connected clients count */
    connectedClients?: number;
    /** Total bytes received */
    rx?: number;
    /** Total bytes transmitted */
    tx?: number;
    /** Optional comment */
    comment?: string;
    /** Toggle enabled handler */
    onToggle?: (id: string, enabled: boolean) => void;
    /** Edit handler */
    onEdit?: (id: string) => void;
    /** Delete handler */
    onDelete?: (id: string) => void;
    /** View details handler */
    onViewDetails?: (id: string) => void;
    /** Loading state for toggle */
    isToggling?: boolean;
    /** Custom className */
    className?: string;
}
export declare const VPNServerCard: import("react").MemoExoticComponent<import("react").ForwardRefExoticComponent<VPNServerCardProps & import("react").RefAttributes<HTMLDivElement>>>;
//# sourceMappingURL=VPNServerCard.d.ts.map