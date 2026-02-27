/**
 * Toggle VPN Interface Mutation Hook
 * Enables/disables VPN interfaces for all protocols
 */
import type { VPNProtocol } from '@nasnet/core/types';
/**
 * Request payload for toggling VPN interface state
 */
export interface ToggleVPNInterfaceRequest {
  routerIp: string;
  id: string;
  name: string;
  protocol: VPNProtocol;
  disabled: boolean;
}
/**
 * Hook for toggling VPN interface state
 */
export declare function useToggleVPNInterface(): import('@tanstack/react-query').UseMutationResult<
  void,
  Error,
  ToggleVPNInterfaceRequest,
  unknown
>;
//# sourceMappingURL=useToggleVPNInterface.d.ts.map
