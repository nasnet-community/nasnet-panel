/**
 * Connection Tracking Types
 *
 * Types for MikroTik firewall connection tracking entries.
 * Import official types from @nasnet/core/types and add pattern-specific types.
 */

// Import official types from core
import type { Connection, ConnectionTrackingState, ConnectionFilters } from '@nasnet/core/types';

// Re-export core types for convenience
export type { Connection, ConnectionTrackingState, ConnectionFilters };

// Alias for backward compatibility
export type ConnectionState = ConnectionTrackingState;

/**
 * Alias for Connection to maintain backward compatibility with existing components
 * @deprecated Use Connection instead
 */
export type ConnectionEntry = Connection;

/**
 * Filter criteria for connection list (extends core ConnectionFilters)
 * Adds UI-specific 'all' option for dropdowns
 */
export interface ConnectionFilter extends Omit<ConnectionFilters, 'protocol' | 'state'> {
  /** Filter by IP address (source or destination) with wildcard support */
  ipAddress?: string; // Renamed from 'ip' to match core 'ipAddress'

  /** Filter by port (source or destination) */
  port?: number;

  /** Filter by protocol (string or 'all' for UI dropdown) */
  protocol?: string | 'all';

  /** Filter by connection state (or 'all' for UI dropdown) */
  state?: ConnectionState | 'all';
}

/**
 * Sort field for connections
 */
export type ConnectionSortField =
  | 'srcAddress'
  | 'dstAddress'
  | 'srcPort'
  | 'dstPort'
  | 'protocol'
  | 'state'
  | 'timeout'
  | 'bytes'
  | 'packets';

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Sort configuration
 */
export interface ConnectionSort {
  field: ConnectionSortField;
  direction: SortDirection;
}
