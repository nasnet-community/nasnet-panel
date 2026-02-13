/**
 * FirewallLogFilters Types
 *
 * TypeScript interfaces for firewall log filter components.
 *
 * @module @nasnet/ui/patterns/firewall-log-filters
 */

import type { InferredAction } from '@nasnet/core/types/firewall';

/**
 * Time range preset options
 */
export type TimeRangePreset = '1h' | '6h' | '1d' | '1w' | 'custom';

/**
 * Time range value with start and end timestamps
 */
export interface TimeRange {
  start: Date;
  end: Date;
}

/**
 * Port range value
 */
export interface PortRange {
  min: number;
  max: number;
}

/**
 * Complete filter state for firewall logs
 */
export interface FirewallLogFilterState {
  /**
   * Time range preset or custom
   */
  timeRangePreset: TimeRangePreset;

  /**
   * Custom time range (only when preset is 'custom')
   */
  timeRange?: TimeRange;

  /**
   * Selected actions to filter by
   */
  actions: InferredAction[];

  /**
   * Source IP filter with wildcard support (e.g., 192.168.1.*)
   */
  srcIp?: string;

  /**
   * Destination IP filter with wildcard support
   */
  dstIp?: string;

  /**
   * Source port or port range
   */
  srcPort?: number | PortRange;

  /**
   * Destination port or port range
   */
  dstPort?: number | PortRange;

  /**
   * Log prefix filter
   */
  prefix?: string;
}

/**
 * FirewallLogFilters Props
 */
export interface FirewallLogFiltersProps {
  /**
   * Current filter state
   */
  filters: FirewallLogFilterState;

  /**
   * Callback when filters change
   */
  onFiltersChange: (filters: FirewallLogFilterState) => void;

  /**
   * Available log prefixes for autocomplete (from current logs)
   */
  availablePrefixes?: string[];

  /**
   * Is filters panel open (mobile only)
   */
  open?: boolean;

  /**
   * Callback when filters panel is closed (mobile only)
   */
  onClose?: () => void;

  /**
   * Active filter count for badge display
   */
  activeFilterCount?: number;
}

/**
 * Default filter state
 */
export const DEFAULT_FILTER_STATE: FirewallLogFilterState = {
  timeRangePreset: '1h',
  actions: [],
};
