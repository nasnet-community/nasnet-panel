/**
 * BlockedIPsTable Types
 *
 * Types for the BlockedIPsTable pattern component.
 * Import official types from @nasnet/core/types and add pattern-specific types.
 */

// Import official types from core
import type { BlockedIP } from '@nasnet/core/types';

// Re-export core types for convenience
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
export type BlockedIPSortField =
  | 'address'
  | 'list'
  | 'blockCount'
  | 'firstBlocked'
  | 'lastBlocked'
  | 'timeout';

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
  value: string; // RouterOS duration format
}

/**
 * Timeout presets for whitelist dialog
 */
export const WHITELIST_TIMEOUT_PRESETS: WhitelistTimeoutPreset[] = [
  { label: '15 minutes', value: '15m' },
  { label: '1 hour', value: '1h' },
  { label: '6 hours', value: '6h' },
  { label: '24 hours', value: '24h' },
  { label: 'Permanent', value: '' },
];
