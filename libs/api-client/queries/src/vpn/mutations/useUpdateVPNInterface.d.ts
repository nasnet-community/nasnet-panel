/**
 * Update VPN Interface Mutation Hook
 * Updates existing VPN interfaces for all protocols
 */
import type { VPNProtocol } from '@nasnet/core/types';
/**
 * Request payload for updating VPN interface
 */
export interface UpdateVPNInterfaceRequest {
    routerIp: string;
    id: string;
    name: string;
    protocol: VPNProtocol;
    type: 'server' | 'client' | 'peer';
    updates: Record<string, unknown>;
}
/**
 * Hook for updating VPN interfaces
 */
export declare function useUpdateVPNInterface(): import("@tanstack/react-query").UseMutationResult<void, Error, UpdateVPNInterfaceRequest, unknown>;
//# sourceMappingURL=useUpdateVPNInterface.d.ts.map