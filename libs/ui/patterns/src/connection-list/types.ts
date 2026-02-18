/**
 * Connection Tracking Types
 *
 * Types for MikroTik firewall connection tracking entries.
 * Import official types from @nasnet/core/types and add pattern-specific types.
 */

/**
 * Connection tracking state for active connections
 * Matches MikroTik's connection tracking states
 */
export type ConnectionTrackingState =
  | 'established'
  | 'new'
  | 'related'
  | 'invalid'
  | 'time-wait'
  | 'syn-sent'
  | 'syn-received'
  | 'fin-wait'
  | 'close-wait'
  | 'last-ack'
  | 'close';

/**
 * Active connection entry from connection tracking table
 */
export interface Connection {
  id: string;
  protocol: 'tcp' | 'udp' | 'icmp' | 'gre' | string;
  srcAddress: string;
  srcPort?: number;
  dstAddress: string;
  dstPort?: number;
  replyDstAddress?: string;
  replyDstPort?: number;
  state: ConnectionTrackingState;
  timeout: string;
  packets: number;
  bytes: number;
  assured?: boolean;
  confirmed?: boolean;
}

/**
 * Filter options for connection search
 */
export interface ConnectionFilters {
  ipAddress?: string;
  port?: number;
  protocol?: string;
  state?: ConnectionTrackingState;
}

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
