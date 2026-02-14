/**
 * ResourceBudgetPanel Headless Hook
 *
 * Provides all logic and state for resource budget display and management.
 * Follows the Headless + Platform Presenter pattern.
 *
 * Responsibilities:
 * - Sort instance data by various columns
 * - Calculate usage percentages and status
 * - Filter instances (running only, etc.)
 * - Aggregate system totals
 * - Provide formatted values for display
 */

import { useState, useMemo } from 'react';

import type {
  ResourceBudgetPanelProps,
  ServiceInstanceResource,
  EnhancedServiceInstanceResource,
  SortColumn,
  SortDirection,
} from './types';
import type { UsageStatus } from '../resource-usage-bar';

// ===== Constants =====

/**
 * Usage thresholds (percentage)
 * Same as ResourceUsageBar defaults
 */
const USAGE_THRESHOLDS = {
  IDLE: 0,
  NORMAL: 60,
  WARNING: 80,
  CRITICAL: 95,
} as const;

// ===== Helper Functions =====

/**
 * Calculate usage percentage
 */
function calculateUsagePercent(used: number, limit: number): number {
  if (limit <= 0) return 0;
  const pct = (used / limit) * 100;
  return Math.min(100, Math.max(0, pct));
}

/**
 * Determine usage status based on percentage
 */
function calculateUsageStatus(percentage: number): UsageStatus {
  if (Number.isNaN(percentage) || percentage < 0) {
    return 'unknown';
  }

  if (percentage <= USAGE_THRESHOLDS.IDLE) {
    return 'idle';
  }

  if (percentage < USAGE_THRESHOLDS.NORMAL) {
    return 'normal';
  }

  if (percentage < USAGE_THRESHOLDS.WARNING) {
    return 'warning';
  }

  if (percentage < USAGE_THRESHOLDS.CRITICAL) {
    return 'critical';
  }

  return 'danger';
}

/**
 * Enhance instance with computed fields
 */
function enhanceInstance(instance: ServiceInstanceResource): EnhancedServiceInstanceResource {
  const usagePercent = calculateUsagePercent(instance.memoryUsed, instance.memoryLimit);
  const usageStatus = calculateUsageStatus(usagePercent);

  return {
    ...instance,
    usagePercent,
    usageStatus,
  };
}

/**
 * Sort comparator factory
 */
function createSortComparator(
  column: SortColumn,
  direction: SortDirection
): (a: EnhancedServiceInstanceResource, b: EnhancedServiceInstanceResource) => number {
  const multiplier = direction === 'asc' ? 1 : -1;

  return (a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (column) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        return multiplier * aValue.localeCompare(bValue);

      case 'status':
        aValue = a.status;
        bValue = b.status;
        return multiplier * aValue.localeCompare(bValue);

      case 'memoryUsed':
        aValue = a.memoryUsed;
        bValue = b.memoryUsed;
        return multiplier * (aValue - bValue);

      case 'memoryLimit':
        aValue = a.memoryLimit;
        bValue = b.memoryLimit;
        return multiplier * (aValue - bValue);

      case 'usagePercent':
        aValue = a.usagePercent;
        bValue = b.usagePercent;
        return multiplier * (aValue - bValue);

      default:
        return 0;
    }
  };
}

/**
 * Format memory value
 */
function formatMemory(mb: number): string {
  return `${Math.round(mb)} MB`;
}

/**
 * Format percentage
 */
function formatPercent(pct: number): string {
  return `${Math.round(pct)}%`;
}

// ===== Hook State Interface =====

/**
 * State returned by useResourceBudgetPanel hook
 */
export interface UseResourceBudgetPanelReturn {
  /**
   * Enhanced and sorted instances
   */
  instances: EnhancedServiceInstanceResource[];

  /**
   * System totals
   */
  systemTotals: ResourceBudgetPanelProps['systemTotals'];

  /**
   * Current sort column
   */
  sortColumn: SortColumn;

  /**
   * Current sort direction
   */
  sortDirection: SortDirection;

  /**
   * Toggle sort column (or change direction if same column)
   */
  toggleSort: (column: SortColumn) => void;

  /**
   * Total number of instances (after filtering)
   */
  totalInstances: number;

  /**
   * System-wide usage percentage
   */
  systemUsagePercent: number;

  /**
   * System-wide usage status
   */
  systemUsageStatus: UsageStatus;

  /**
   * Formatted system total memory used
   */
  systemTotalUsedText: string;

  /**
   * Formatted system total memory available
   */
  systemTotalAvailableText: string;

  /**
   * Formatted system usage percent
   */
  systemUsagePercentText: string;

  /**
   * Whether there are any instances
   */
  hasInstances: boolean;

  /**
   * Whether data is loading
   */
  isLoading: boolean;

  /**
   * Empty state message
   */
  emptyMessage: string;
}

// ===== Hook Implementation =====

/**
 * Headless hook for resource budget panel state.
 *
 * Provides all the logic and derived state needed by presenters.
 * Does not render anything - that's the presenter's job.
 *
 * @example
 * ```tsx
 * function ResourceBudgetPanelDesktop(props: ResourceBudgetPanelProps) {
 *   const state = useResourceBudgetPanel(props);
 *
 *   return (
 *     <table>
 *       <thead>
 *         <tr>
 *           <th onClick={() => state.toggleSort('name')}>Name</th>
 *           <th onClick={() => state.toggleSort('memoryUsed')}>Memory Used</th>
 *         </tr>
 *       </thead>
 *       <tbody>
 *         {state.instances.map(instance => (
 *           <tr key={instance.id}>
 *             <td>{instance.name}</td>
 *             <td>{instance.memoryUsed} MB</td>
 *           </tr>
 *         ))}
 *       </tbody>
 *     </table>
 *   );
 * }
 * ```
 */
export function useResourceBudgetPanel(
  props: ResourceBudgetPanelProps
): UseResourceBudgetPanelReturn {
  const {
    instances: rawInstances,
    systemTotals,
    initialSortColumn = 'usagePercent',
    initialSortDirection = 'desc',
    showOnlyRunning = false,
    isLoading = false,
    emptyMessage = 'No service instances found',
  } = props;

  // Sort state
  const [sortColumn, setSortColumn] = useState<SortColumn>(initialSortColumn);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSortDirection);

  // Toggle sort handler
  const toggleSort = (column: SortColumn) => {
    if (column === sortColumn) {
      // Same column: toggle direction
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      // New column: set to desc by default
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // Enhance instances with computed fields (memoized)
  const enhancedInstances = useMemo(
    () => rawInstances.map(enhanceInstance),
    [rawInstances]
  );

  // Filter instances (memoized)
  const filteredInstances = useMemo(() => {
    if (!showOnlyRunning) {
      return enhancedInstances;
    }
    return enhancedInstances.filter((i) => i.status === 'running');
  }, [enhancedInstances, showOnlyRunning]);

  // Sort instances (memoized)
  const sortedInstances = useMemo(() => {
    const comparator = createSortComparator(sortColumn, sortDirection);
    return [...filteredInstances].sort(comparator);
  }, [filteredInstances, sortColumn, sortDirection]);

  // Calculate system-wide usage
  const systemUsagePercent = useMemo(() => {
    return calculateUsagePercent(
      systemTotals.totalMemoryUsed,
      systemTotals.totalMemoryAvailable
    );
  }, [systemTotals]);

  const systemUsageStatus = useMemo(() => {
    return calculateUsageStatus(systemUsagePercent);
  }, [systemUsagePercent]);

  // Formatted system values
  const systemTotalUsedText = formatMemory(systemTotals.totalMemoryUsed);
  const systemTotalAvailableText = formatMemory(systemTotals.totalMemoryAvailable);
  const systemUsagePercentText = formatPercent(systemUsagePercent);

  // Derived values
  const totalInstances = sortedInstances.length;
  const hasInstances = totalInstances > 0;

  return {
    instances: sortedInstances,
    systemTotals,
    sortColumn,
    sortDirection,
    toggleSort,
    totalInstances,
    systemUsagePercent,
    systemUsageStatus,
    systemTotalUsedText,
    systemTotalAvailableText,
    systemUsagePercentText,
    hasInstances,
    isLoading,
    emptyMessage,
  };
}
