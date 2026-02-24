/**
 * Rate Limiting Query Hooks
 * NAS-7.11: Implement Connection Rate Limiting
 *
 * Provides hooks for managing connection rate limiting, SYN flood protection,
 * and blocked IP statistics. Uses TanStack Query for data fetching and caching.
 *
 * @see Docs/sprint-artifacts/Epic7-Security-Firewall/NAS-7-11-implement-connection-rate-limiting.md
 */
import { UseQueryResult } from '@tanstack/react-query';
import { RateLimitRule, RateLimitRuleInput, SynFloodConfig, BlockedIP, RateLimitStats } from '@nasnet/core/types';
/**
 * Input for creating a rate limit rule
 */
export interface CreateRateLimitRuleInput extends Omit<RateLimitRuleInput, 'id' | 'packets' | 'bytes'> {
}
/**
 * Input for updating a rate limit rule
 */
export interface UpdateRateLimitRuleInput extends Partial<CreateRateLimitRuleInput> {
    id: string;
}
/**
 * Input for whitelisting an IP
 */
export interface WhitelistIPInput {
    address: string;
    timeout?: string;
    comment?: string;
}
/**
 * Query keys for rate limiting operations
 * Follows TanStack Query best practices for hierarchical keys
 */
export declare const rateLimitingKeys: {
    all: (routerId: string) => readonly ["rateLimiting", string];
    rules: (routerId: string) => readonly ["rateLimiting", "rules", string];
    synFlood: (routerId: string) => readonly ["rateLimiting", "synFlood", string];
    stats: (routerId: string) => readonly ["rateLimiting", "stats", string];
    blockedIPs: (routerId: string, listNames: string[]) => readonly ["rateLimiting", "blockedIPs", string, string[]];
};
/**
 * Hook to fetch all rate limit rules
 *
 * Fetches firewall filter rules with connection-rate matcher
 * Stale time: 30 seconds
 *
 * @param routerId - Target router IP address
 * @param options - Query options
 * @returns Query result with RateLimitRule[] data
 */
interface UseRateLimitRulesOptions {
    enabled?: boolean;
}
export declare function useRateLimitRules(routerId: string, options?: UseRateLimitRulesOptions): UseQueryResult<RateLimitRule[], Error>;
/**
 * Hook to fetch SYN flood protection configuration
 *
 * Fetches RAW firewall rules for SYN flood protection
 * Stale time: 60 seconds
 *
 * @param routerId - Target router IP address
 * @param options - Query options
 * @returns Query result with SynFloodConfig data
 */
interface UseSynFloodConfigOptions {
    enabled?: boolean;
}
export declare function useSynFloodConfig(routerId: string, options?: UseSynFloodConfigOptions): UseQueryResult<SynFloodConfig, Error>;
/**
 * Hook to fetch rate limit statistics
 *
 * Aggregates counters and blocked IPs from rate limit rules
 * Stale time: 5 seconds (for polling)
 *
 * @param routerId - Target router IP address
 * @param options - Query options with polling interval
 * @returns Query result with RateLimitStats data
 */
interface UseRateLimitStatsOptions {
    enabled?: boolean;
    pollingInterval?: number;
}
export declare function useRateLimitStats(routerId: string, options?: UseRateLimitStatsOptions): UseQueryResult<RateLimitStats, Error>;
/**
 * Hook to fetch blocked IPs from address lists
 *
 * Fetches IPs from specified address lists
 * Stale time: 30 seconds
 *
 * @param routerId - Target router IP address
 * @param listNames - Array of address list names
 * @param options - Query options
 * @returns Query result with BlockedIP[] data
 */
interface UseBlockedIPsOptions {
    enabled?: boolean;
}
export declare function useBlockedIPs(routerId: string, listNames: string[], options?: UseBlockedIPsOptions): UseQueryResult<BlockedIP[], Error>;
/**
 * Hook to create a new rate limit rule
 *
 * Automatically invalidates rate limit rules and stats queries
 * Uses optimistic updates for instant UI feedback
 *
 * @returns Mutation function and state
 */
export declare function useCreateRateLimitRule(routerId: string): import("@tanstack/react-query").UseMutationResult<{
    action: "drop" | "tarpit" | "add-to-list";
    connectionLimit: number;
    timeWindow: "per-second" | "per-minute" | "per-hour";
    isDisabled: boolean;
    id?: string | undefined;
    srcAddress?: string | undefined;
    srcAddressList?: string | undefined;
    comment?: string | undefined;
    packets?: number | undefined;
    bytes?: number | undefined;
    addressList?: string | undefined;
    addressListTimeout?: string | undefined;
}, Error, CreateRateLimitRuleInput, unknown>;
/**
 * Hook to update an existing rate limit rule
 *
 * Automatically invalidates rate limit rules query
 * Uses optimistic updates for instant UI feedback
 *
 * @returns Mutation function and state
 */
export declare function useUpdateRateLimitRule(routerId: string): import("@tanstack/react-query").UseMutationResult<void, Error, UpdateRateLimitRuleInput, {
    previousRules: {
        action: "drop" | "tarpit" | "add-to-list";
        connectionLimit: number;
        timeWindow: "per-second" | "per-minute" | "per-hour";
        isDisabled: boolean;
        id?: string | undefined;
        srcAddress?: string | undefined;
        srcAddressList?: string | undefined;
        comment?: string | undefined;
        packets?: number | undefined;
        bytes?: number | undefined;
        addressList?: string | undefined;
        addressListTimeout?: string | undefined;
    }[] | undefined;
}>;
/**
 * Hook to delete a rate limit rule
 *
 * Automatically invalidates rate limit rules and stats queries
 * Uses optimistic updates for instant UI feedback
 *
 * @returns Mutation function and state
 */
export declare function useDeleteRateLimitRule(routerId: string): import("@tanstack/react-query").UseMutationResult<void, Error, string, {
    previousRules: {
        action: "drop" | "tarpit" | "add-to-list";
        connectionLimit: number;
        timeWindow: "per-second" | "per-minute" | "per-hour";
        isDisabled: boolean;
        id?: string | undefined;
        srcAddress?: string | undefined;
        srcAddressList?: string | undefined;
        comment?: string | undefined;
        packets?: number | undefined;
        bytes?: number | undefined;
        addressList?: string | undefined;
        addressListTimeout?: string | undefined;
    }[] | undefined;
}>;
/**
 * Hook to toggle a rate limit rule (enable/disable)
 *
 * Automatically invalidates rate limit rules query
 * Uses optimistic updates for instant UI feedback
 *
 * @returns Mutation function and state
 */
export declare function useToggleRateLimitRule(routerId: string): import("@tanstack/react-query").UseMutationResult<void, Error, {
    ruleId: string;
    disabled: boolean;
}, {
    previousRules: {
        action: "drop" | "tarpit" | "add-to-list";
        connectionLimit: number;
        timeWindow: "per-second" | "per-minute" | "per-hour";
        isDisabled: boolean;
        id?: string | undefined;
        srcAddress?: string | undefined;
        srcAddressList?: string | undefined;
        comment?: string | undefined;
        packets?: number | undefined;
        bytes?: number | undefined;
        addressList?: string | undefined;
        addressListTimeout?: string | undefined;
    }[] | undefined;
}>;
/**
 * Hook to update SYN flood protection configuration
 *
 * Automatically invalidates SYN flood config query
 *
 * @returns Mutation function and state
 */
export declare function useUpdateSynFloodConfig(routerId: string): import("@tanstack/react-query").UseMutationResult<void, Error, {
    action: "drop" | "tarpit";
    burst: number;
    isEnabled: boolean;
    synLimit: number;
}, unknown>;
/**
 * Hook to whitelist an IP address
 *
 * Automatically invalidates blocked IPs and address lists queries
 *
 * @returns Mutation function and state
 */
export declare function useWhitelistIP(routerId: string): import("@tanstack/react-query").UseMutationResult<void, Error, WhitelistIPInput, unknown>;
/**
 * Hook to remove a blocked IP from address list
 *
 * Automatically invalidates blocked IPs and stats queries
 *
 * @returns Mutation function and state
 */
export declare function useRemoveBlockedIP(routerId: string): import("@tanstack/react-query").UseMutationResult<void, Error, string, unknown>;
export {};
//# sourceMappingURL=useRateLimiting.d.ts.map