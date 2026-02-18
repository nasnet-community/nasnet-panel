/**
 * Headless useFirewallLogFilters Hook
 *
 * Manages firewall log filter state and provides utility functions
 * for wildcard IP matching, port range validation, and filter counts.
 *
 * @module @nasnet/ui/patterns/firewall-log-filters
 */

import { useCallback, useMemo } from 'react';

import type { InferredAction } from '@nasnet/core/types';

import type {
  FirewallLogFilterState,
  TimeRangePreset,
  TimeRange,
  PortRange,
} from './firewall-log-filters.types';

// ============================================================================
// Types
// ============================================================================

export interface UseFirewallLogFiltersOptions {
  /** Current filter state */
  filters: FirewallLogFilterState;
  /** Callback when filters change */
  onFiltersChange: (filters: FirewallLogFilterState) => void;
  /** Available prefixes for autocomplete */
  availablePrefixes?: string[];
}

export interface UseFirewallLogFiltersReturn {
  /** Current filters */
  filters: FirewallLogFilterState;
  /** Update time range preset */
  setTimeRangePreset: (preset: TimeRangePreset) => void;
  /** Update custom time range */
  setCustomTimeRange: (range: TimeRange) => void;
  /** Toggle action filter */
  toggleAction: (action: InferredAction) => void;
  /** Set source IP filter */
  setSrcIp: (ip: string) => void;
  /** Set destination IP filter */
  setDstIp: (ip: string) => void;
  /** Set source port filter */
  setSrcPort: (port: string) => void;
  /** Set destination port filter */
  setDstPort: (port: string) => void;
  /** Set prefix filter */
  setPrefix: (prefix: string) => void;
  /** Clear all filters */
  clearFilters: () => void;
  /** Active filter count */
  activeFilterCount: number;
  /** Computed time range from preset or custom */
  computedTimeRange: TimeRange;
  /** Validation: Is IP filter valid (with wildcard support) */
  isValidIpFilter: (ip: string) => boolean;
  /** Validation: Is port filter valid (single or range) */
  isValidPortFilter: (port: string) => boolean;
  /** Available prefixes for autocomplete */
  availablePrefixes: string[];
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get time range from preset
 */
function getTimeRangeFromPreset(preset: TimeRangePreset): TimeRange {
  const end = new Date();
  const start = new Date();

  switch (preset) {
    case '1h':
      start.setHours(start.getHours() - 1);
      break;
    case '6h':
      start.setHours(start.getHours() - 6);
      break;
    case '1d':
      start.setDate(start.getDate() - 1);
      break;
    case '1w':
      start.setDate(start.getDate() - 7);
      break;
    case 'custom':
      // Return current for custom (will be overridden by timeRange)
      break;
  }

  return { start, end };
}

/**
 * Validate IP address with wildcard support
 * Supports: 192.168.1.*, 10.0.*.*, 172.16.0.1
 */
function validateIpWithWildcard(ip: string): boolean {
  if (!ip) return true; // Empty is valid (no filter)

  // Split by dots
  const parts = ip.split('.');
  if (parts.length !== 4) return false;

  // Each part must be either:
  // - A wildcard (*)
  // - A valid octet (0-255)
  return parts.every((part) => {
    if (part === '*') return true;
    const num = parseInt(part, 10);
    return !isNaN(num) && num >= 0 && num <= 255;
  });
}

/**
 * Validate port or port range
 * Supports: 80, 8080, 80-443
 */
function validatePortFilter(port: string): boolean {
  if (!port) return true; // Empty is valid (no filter)

  // Check for range (80-443)
  if (port.includes('-')) {
    const [min, max] = port.split('-').map((p) => parseInt(p.trim(), 10));
    return (
      !isNaN(min) &&
      !isNaN(max) &&
      min >= 1 &&
      min <= 65535 &&
      max >= 1 &&
      max <= 65535 &&
      min < max
    );
  }

  // Single port
  const num = parseInt(port, 10);
  return !isNaN(num) && num >= 1 && num <= 65535;
}

/**
 * Parse port string to number or PortRange
 */
function parsePortFilter(port: string): number | PortRange | undefined {
  if (!port) return undefined;

  if (port.includes('-')) {
    const [min, max] = port.split('-').map((p) => parseInt(p.trim(), 10));
    return { min, max };
  }

  return parseInt(port, 10);
}

/**
 * Calculate active filter count
 */
function calculateActiveFilterCount(filters: FirewallLogFilterState): number {
  let count = 0;

  // Time range preset (custom counts as active)
  if (filters.timeRangePreset === 'custom' && filters.timeRange) {
    count++;
  }

  // Actions
  if (filters.actions.length > 0) {
    count++;
  }

  // IP filters
  if (filters.srcIp) count++;
  if (filters.dstIp) count++;

  // Port filters
  if (filters.srcPort !== undefined) count++;
  if (filters.dstPort !== undefined) count++;

  // Prefix
  if (filters.prefix) count++;

  return count;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Headless hook for firewall log filters.
 *
 * Manages filter state, validation, and provides utility functions
 * for wildcard IP matching and port range validation.
 *
 * @example
 * ```tsx
 * const filterHook = useFirewallLogFilters({
 *   filters: currentFilters,
 *   onFiltersChange: handleFiltersChange,
 *   availablePrefixes: ['DROPPED-', 'ACCEPTED-'],
 * });
 *
 * return (
 *   <div>
 *     <input
 *       value={filterHook.filters.srcIp || ''}
 *       onChange={(e) => filterHook.setSrcIp(e.target.value)}
 *     />
 *   </div>
 * );
 * ```
 */
export function useFirewallLogFilters(
  options: UseFirewallLogFiltersOptions
): UseFirewallLogFiltersReturn {
  const { filters, onFiltersChange, availablePrefixes = [] } = options;

  // Computed time range
  const computedTimeRange = useMemo(() => {
    if (filters.timeRangePreset === 'custom' && filters.timeRange) {
      return filters.timeRange;
    }
    return getTimeRangeFromPreset(filters.timeRangePreset);
  }, [filters.timeRangePreset, filters.timeRange]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    return calculateActiveFilterCount(filters);
  }, [filters]);

  // Set time range preset
  const setTimeRangePreset = useCallback(
    (preset: TimeRangePreset) => {
      onFiltersChange({
        ...filters,
        timeRangePreset: preset,
        // Clear custom range if switching to preset
        timeRange: preset === 'custom' ? filters.timeRange : undefined,
      });
    },
    [filters, onFiltersChange]
  );

  // Set custom time range
  const setCustomTimeRange = useCallback(
    (range: TimeRange) => {
      onFiltersChange({
        ...filters,
        timeRangePreset: 'custom',
        timeRange: range,
      });
    },
    [filters, onFiltersChange]
  );

  // Toggle action filter
  const toggleAction = useCallback(
    (action: InferredAction) => {
      const currentActions = filters.actions;
      const newActions = currentActions.includes(action)
        ? currentActions.filter((a) => a !== action)
        : [...currentActions, action];

      onFiltersChange({
        ...filters,
        actions: newActions,
      });
    },
    [filters, onFiltersChange]
  );

  // Set source IP filter
  const setSrcIp = useCallback(
    (ip: string) => {
      onFiltersChange({
        ...filters,
        srcIp: ip || undefined,
      });
    },
    [filters, onFiltersChange]
  );

  // Set destination IP filter
  const setDstIp = useCallback(
    (ip: string) => {
      onFiltersChange({
        ...filters,
        dstIp: ip || undefined,
      });
    },
    [filters, onFiltersChange]
  );

  // Set source port filter
  const setSrcPort = useCallback(
    (port: string) => {
      onFiltersChange({
        ...filters,
        srcPort: parsePortFilter(port),
      });
    },
    [filters, onFiltersChange]
  );

  // Set destination port filter
  const setDstPort = useCallback(
    (port: string) => {
      onFiltersChange({
        ...filters,
        dstPort: parsePortFilter(port),
      });
    },
    [filters, onFiltersChange]
  );

  // Set prefix filter
  const setPrefix = useCallback(
    (prefix: string) => {
      onFiltersChange({
        ...filters,
        prefix: prefix || undefined,
      });
    },
    [filters, onFiltersChange]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    onFiltersChange({
      timeRangePreset: '1h',
      actions: [],
    });
  }, [onFiltersChange]);

  // Validation functions
  const isValidIpFilter = useCallback((ip: string) => {
    return validateIpWithWildcard(ip);
  }, []);

  const isValidPortFilter = useCallback((port: string) => {
    return validatePortFilter(port);
  }, []);

  return {
    filters,
    setTimeRangePreset,
    setCustomTimeRange,
    toggleAction,
    setSrcIp,
    setDstIp,
    setSrcPort,
    setDstPort,
    setPrefix,
    clearFilters,
    activeFilterCount,
    computedTimeRange,
    isValidIpFilter,
    isValidPortFilter,
    availablePrefixes,
  };
}
