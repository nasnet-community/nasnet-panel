/**
 * VPN Client Card Component
 *
 * Displays a VPN client with status, server, connection stats, and actions.
 * Supports all VPN protocols.
 *
 * @example
 * ```tsx
 * <VPNClientCard
 *   id="1"
 *   name="Office VPN"
 *   protocol="wireguard"
 *   isDisabled={false}
 *   isRunning={true}
 *   connectTo="vpn.example.com"
 * />
 * ```
 */
import type { VPNProtocol } from '@nasnet/core/types';
export interface VPNClientCardProps {
    /** Client ID */
    id: string;
    /** Client name */
    name: string;
    /** VPN protocol */
    protocol: VPNProtocol;
    /** Client enabled/disabled */
    isDisabled: boolean;
    /** Client running/connected state */
    isRunning: boolean;
    /** Remote server address */
    connectTo: string;
    /** Remote port */
    port?: number;
    /** Username */
    user?: string;
    /** Connection uptime */
    uptime?: string;
    /** Total bytes received */
    rx?: number;
    /** Total bytes transmitted */
    tx?: number;
    /** Local IP address */
    localAddress?: string;
    /** Remote IP address */
    remoteAddress?: string;
    /** Optional comment */
    comment?: string;
    /** Toggle enabled handler */
    onToggle?: (id: string, enabled: boolean) => void;
    /** Connect/Disconnect handler */
    onConnect?: (id: string) => void;
    /** Edit handler */
    onEdit?: (id: string) => void;
    /** Delete handler */
    onDelete?: (id: string) => void;
    /** Loading state for toggle */
    isToggling?: boolean;
    /** Custom className */
    className?: string;
}
/**
 * VPNClientCard Component
 */
declare function VPNClientCardComponent({ id, name, protocol, isDisabled, isRunning, connectTo, port, user, uptime, rx, tx, localAddress, remoteAddress, comment, onToggle, onConnect, onEdit, onDelete, isToggling, className, }: VPNClientCardProps): import("react/jsx-runtime").JSX.Element;
export declare const VPNClientCard: import("react").MemoExoticComponent<typeof VPNClientCardComponent>;
export {};
//# sourceMappingURL=VPNClientCard.d.ts.map