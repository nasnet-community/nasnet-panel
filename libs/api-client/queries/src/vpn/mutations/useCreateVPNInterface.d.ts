/**
 * Create VPN Interface Mutation Hook
 * Creates new VPN interfaces for all protocols
 */
import type { WireGuardServerInput, WireGuardPeerInput, OpenVPNServerInput, OpenVPNClientInput, PPPClientInput, IPsecPeerInput } from '@nasnet/core/types';
/**
 * Union type for all VPN creation inputs
 */
export type VPNCreateInput = {
    protocol: 'wireguard';
    type: 'server';
    data: WireGuardServerInput;
} | {
    protocol: 'wireguard';
    type: 'peer';
    data: WireGuardPeerInput;
} | {
    protocol: 'openvpn';
    type: 'server';
    data: OpenVPNServerInput;
} | {
    protocol: 'openvpn';
    type: 'client';
    data: OpenVPNClientInput;
} | {
    protocol: 'l2tp';
    type: 'client';
    data: PPPClientInput;
} | {
    protocol: 'pptp';
    type: 'client';
    data: PPPClientInput;
} | {
    protocol: 'sstp';
    type: 'client';
    data: PPPClientInput;
} | {
    protocol: 'ikev2';
    type: 'peer';
    data: IPsecPeerInput;
};
/**
 * Request payload for creating VPN interface
 */
export interface CreateVPNInterfaceRequest {
    routerIp: string;
    input: VPNCreateInput;
}
/**
 * Hook for creating VPN interfaces
 */
export declare function useCreateVPNInterface(): import("@tanstack/react-query").UseMutationResult<{
    id: string;
}, Error, CreateVPNInterfaceRequest, unknown>;
//# sourceMappingURL=useCreateVPNInterface.d.ts.map