/**
 * Firewall Mangle Rules Query and Mutation Hooks
 * Fetches and manages mangle rules from RouterOS REST API
 * Uses rosproxy backend for RouterOS API communication
 *
 * Mangle rules are used for traffic marking and manipulation:
 * - mark-connection: Mark all packets in a connection (for QoS)
 * - mark-packet: Mark individual packets
 * - mark-routing: Mark for routing decisions (policy routing)
 * - change-dscp: Set DSCP priority for QoS
 * - change-ttl: Modify Time To Live
 * - change-mss: Clamp Maximum Segment Size
 *
 * @see Docs/sprint-artifacts/Epic7-Security-Firewall/NAS-7-5-implement-mangle-rules.md
 */
import { UseQueryResult } from '@tanstack/react-query';
import type { MangleRule, MangleChain } from '@nasnet/core/types';
/**
 * Query keys for mangle rule queries
 * Follows TanStack Query best practices for hierarchical keys
 */
export declare const mangleRulesKeys: {
    all: (routerId: string) => readonly ["mangle", string];
    byChain: (routerId: string, chain: MangleChain) => readonly ["mangle", string, "input" | "output" | "prerouting" | "forward" | "postrouting"];
};
/**
 * Hook to fetch mangle rules
 *
 * Configuration:
 * - staleTime: 300000ms (5 minutes) - mangle rules change infrequently
 * - Auto-refresh disabled - user must manually refresh
 *
 * @param routerId - Target router ID
 * @param options - Query options including chain filter and enabled state
 * @returns Query result with MangleRule[] data
 */
interface UseMangleRulesOptions {
    chain?: MangleChain;
    enabled?: boolean;
}
export declare function useMangleRules(routerId: string, options?: UseMangleRulesOptions): UseQueryResult<MangleRule[], Error>;
/**
 * Create a new mangle rule
 * Endpoint: POST /rest/ip/firewall/mangle/add
 */
export declare function useCreateMangleRule(routerId: string): import("@tanstack/react-query").UseMutationResult<unknown, Error, Partial<{
    log: boolean;
    action: "log" | "accept" | "passthrough" | "drop" | "mark-connection" | "mark-packet" | "mark-routing" | "change-ttl" | "change-dscp" | "change-mss" | "jump";
    disabled: boolean;
    passthrough: boolean;
    chain: "input" | "output" | "prerouting" | "forward" | "postrouting";
    id?: string | undefined;
    content?: string | undefined;
    position?: number | undefined;
    bytes?: number | undefined;
    protocol?: string | undefined;
    srcAddress?: string | undefined;
    dstAddress?: string | undefined;
    srcPort?: string | undefined;
    dstPort?: string | undefined;
    srcAddressList?: string | undefined;
    dstAddressList?: string | undefined;
    inInterface?: string | undefined;
    outInterface?: string | undefined;
    inInterfaceList?: string | undefined;
    outInterfaceList?: string | undefined;
    connectionState?: ("established" | "new" | "related" | "invalid" | "untracked")[] | undefined;
    connectionNatState?: ("srcnat" | "dstnat")[] | undefined;
    connectionMark?: string | undefined;
    packetMark?: string | undefined;
    routingMark?: string | undefined;
    packetSize?: string | undefined;
    layer7Protocol?: string | undefined;
    tcpFlags?: string | undefined;
    newConnectionMark?: string | undefined;
    newPacketMark?: string | undefined;
    newRoutingMark?: string | undefined;
    newDscp?: number | undefined;
    newTtl?: string | undefined;
    newMss?: number | undefined;
    jumpTarget?: string | undefined;
    comment?: string | undefined;
    logPrefix?: string | undefined;
    packets?: number | undefined;
}>, unknown>;
/**
 * Update an existing mangle rule
 * Endpoint: POST /rest/ip/firewall/mangle/set
 */
export declare function useUpdateMangleRule(routerId: string): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    ruleId: string;
    updates: Partial<MangleRule>;
}, unknown>;
/**
 * Delete a mangle rule
 * Endpoint: POST /rest/ip/firewall/mangle/remove
 */
export declare function useDeleteMangleRule(routerId: string): import("@tanstack/react-query").UseMutationResult<unknown, Error, string, unknown>;
/**
 * Move a mangle rule to a new position (drag-drop reordering)
 * Endpoint: POST /rest/ip/firewall/mangle/move
 */
export declare function useMoveMangleRule(routerId: string): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    ruleId: string;
    destination: number;
}, unknown>;
/**
 * Toggle enable/disable state of a mangle rule (convenience wrapper)
 * Endpoint: POST /rest/ip/firewall/mangle/set
 */
export declare function useToggleMangleRule(routerId: string): import("@tanstack/react-query").UseMutationResult<unknown, Error, {
    ruleId: string;
    disabled: boolean;
}, unknown>;
export {};
//# sourceMappingURL=useMangleRules.d.ts.map