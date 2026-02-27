/**
 * NAT Rules Query and Mutation Hooks
 * Fetches and manages NAT rules from RouterOS REST API
 * Uses rosproxy backend for RouterOS API communication
 *
 * NAT rules control network address translation for packets.
 * They are processed in order by chain (srcnat, dstnat).
 *
 * Chains:
 * - srcnat: Source NAT (typically masquerade for outbound traffic)
 * - dstnat: Destination NAT (typically port forwarding for inbound traffic)
 */
import { UseQueryResult } from '@tanstack/react-query';
import type { NATRule } from '@nasnet/core/types';
/**
 * Hook to fetch NAT rules
 *
 * Configuration:
 * - staleTime: 300000ms (5 minutes) - NAT rules change infrequently
 * - Auto-refresh disabled - user must manually refresh
 *
 * @param routerIp - Target router IP address
 * @returns Query result with NATRule[] data
 */
export declare function useNATRules(routerIp: string): UseQueryResult<NATRule[], Error>;
/**
 * Create a new NAT rule
 * Endpoint: POST /rest/ip/firewall/nat/add
 */
export declare function useCreateNATRule(
  routerIp: string
): import('@tanstack/react-query').UseMutationResult<unknown, Error, Partial<NATRule>, unknown>;
/**
 * Update an existing NAT rule
 * Endpoint: POST /rest/ip/firewall/nat/set
 */
export declare function useUpdateNATRule(
  routerIp: string
): import('@tanstack/react-query').UseMutationResult<
  unknown,
  Error,
  {
    ruleId: string;
    updates: Partial<NATRule>;
  },
  unknown
>;
/**
 * Delete a NAT rule
 * Endpoint: POST /rest/ip/firewall/nat/remove
 */
export declare function useDeleteNATRule(
  routerIp: string
): import('@tanstack/react-query').UseMutationResult<unknown, Error, string, unknown>;
/**
 * Create a port forwarding rule (convenience wrapper for dstnat)
 * Automatically configures a destination NAT rule for port forwarding
 *
 * @example
 * ```typescript
 * const createPortForward = useCreatePortForward(routerIp);
 * createPortForward.mutate({
 *   protocol: 'tcp',
 *   dstPort: '8080',
 *   toAddresses: '192.168.1.100',
 *   toPorts: '80',
 *   inInterface: 'ether1',
 *   comment: 'Forward web traffic to internal server'
 * });
 * ```
 */
export declare function useCreatePortForward(
  routerIp: string
): import('@tanstack/react-query').UseMutationResult<
  unknown,
  Error,
  {
    protocol: 'tcp' | 'udp';
    dstPort: string;
    toAddresses: string;
    toPorts: string;
    inInterface?: string;
    dstAddress?: string;
    comment?: string;
    disabled?: boolean;
  },
  unknown
>;
/**
 * Create a masquerade rule (convenience wrapper for srcnat)
 * Automatically configures source NAT masquerading for outbound traffic
 *
 * @example
 * ```typescript
 * const createMasquerade = useCreateMasqueradeRule(routerIp);
 * createMasquerade.mutate({
 *   outInterface: 'ether1',
 *   srcAddress: '192.168.1.0/24',
 *   comment: 'Masquerade LAN traffic'
 * });
 * ```
 */
export declare function useCreateMasqueradeRule(
  routerIp: string
): import('@tanstack/react-query').UseMutationResult<
  unknown,
  Error,
  {
    outInterface: string;
    srcAddress?: string;
    comment?: string;
    disabled?: boolean;
  },
  unknown
>;
/**
 * Toggle enable/disable state of a NAT rule (convenience wrapper)
 * Endpoint: POST /rest/ip/firewall/nat/set
 */
export declare function useToggleNATRule(
  routerIp: string
): import('@tanstack/react-query').UseMutationResult<
  unknown,
  Error,
  {
    ruleId: string;
    disabled: boolean;
  },
  unknown
>;
//# sourceMappingURL=useNATRules.d.ts.map
