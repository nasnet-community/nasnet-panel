/**
 * Delete VPN Interface Mutation Hook
 * Deletes VPN interfaces for all protocols
 */
import type { VPNProtocol } from '@nasnet/core/types';
/**
 * Request payload for deleting VPN interface
 */
export interface DeleteVPNInterfaceRequest {
  routerIp: string;
  id: string;
  name: string;
  protocol: VPNProtocol;
  type: 'server' | 'client' | 'peer';
}
/**
 * Hook for deleting VPN interfaces
 */
export declare function useDeleteVPNInterface(): import('@tanstack/react-query').UseMutationResult<
  void,
  Error,
  DeleteVPNInterfaceRequest,
  unknown
>;
//# sourceMappingURL=useDeleteVPNInterface.d.ts.map
