/**
 * FirewallLogFilters Types
 *
 * Re-exports filter-related types from core/types to avoid circular dependencies.
 * All filter state types are defined in @nasnet/core/types/firewall.
 *
 * @module @nasnet/ui/patterns/firewall-log-filters
 */

import type { FirewallLogFilterState } from '@nasnet/core/types';

// Re-export filter types from core (breaks circular dependency)
export type {
  TimeRangePreset,
  TimeRange,
  PortRange,
  FirewallLogFilterState,
} from '@nasnet/core/types';

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
 * Alias for backward compatibility with existing component code
 * Points to the core default constant
 */
export { DEFAULT_FIREWALL_LOG_FILTER_STATE as DEFAULT_FILTER_STATE } from '@nasnet/core/types';
