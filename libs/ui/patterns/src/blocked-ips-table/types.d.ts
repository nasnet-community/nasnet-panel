/**
 * BlockedIPsTable Types
 *
 * Types for the BlockedIPsTable pattern component.
 * Import official types from @nasnet/core/types and add pattern-specific types.
 */
import type { BlockedIP } from '@nasnet/core/types';
export type { BlockedIP };
/**
 * Filter criteria for blocked IPs list
 */
export interface BlockedIPFilter {
    /** Filter by IP address with wildcard support */
    ipAddress?: string;
    /** Filter by address list name */
    list?: string | 'all';
}
/**
 * Sort field for blocked IPs
 */
export type BlockedIPSortField = 'address' | 'list' | 'blockCount' | 'firstBlocked' | 'lastBlocked' | 'timeout';
/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';
/**
 * Sort configuration
 */
export interface BlockedIPSort {
    field: BlockedIPSortField;
    direction: SortDirection;
}
/**
 * Whitelist timeout options
 */
export type WhitelistTimeout = '15m' | '1h' | '6h' | '24h' | '' | 'permanent';
/**
 * Whitelist timeout preset
 */
export interface WhitelistTimeoutPreset {
    label: string;
    value: string;
}
/**
 * Timeout presets for whitelist dialog
 */
export declare const WHITELIST_TIMEOUT_PRESETS: WhitelistTimeoutPreset[];
//# sourceMappingURL=types.d.ts.map