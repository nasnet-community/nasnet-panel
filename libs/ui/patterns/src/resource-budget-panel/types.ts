/**
 * ResourceBudgetPanel Types
 *
 * Type definitions for the ResourceBudgetPanel pattern component.
 * Follows the Headless + Platform Presenter pattern.
 */

import type { UsageStatus } from '../resource-usage-bar';

/**
 * Service instance resource data
 */
export interface ServiceInstanceResource {
  /**
   * Unique service instance ID
   */
  id: string;

  /**
   * Service name
   */
  name: string;

  /**
   * Current memory usage (in MB)
   */
  memoryUsed: number;

  /**
   * Memory limit (in MB)
   */
  memoryLimit: number;

  /**
   * Instance status
   */
  status: 'running' | 'stopped' | 'pending' | 'error';

  /**
   * Optional: CPU usage percentage (0-100)
   */
  cpuUsage?: number;
}

/**
 * System-wide resource totals
 */
export interface SystemResourceTotals {
  /**
   * Total memory used across all instances (in MB)
   */
  totalMemoryUsed: number;

  /**
   * Total memory available on system (in MB)
   */
  totalMemoryAvailable: number;

  /**
   * Number of running instances
   */
  runningInstances: number;

  /**
   * Number of stopped instances
   */
  stoppedInstances: number;
}

/**
 * Sortable column identifiers
 */
export type SortColumn = 'name' | 'status' | 'memoryUsed' | 'memoryLimit' | 'usagePercent';

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Props for ResourceBudgetPanel component
 */
export interface ResourceBudgetPanelProps {
  /**
   * Service instance resource data
   */
  instances: ServiceInstanceResource[];

  /**
   * System-wide resource totals
   */
  systemTotals: SystemResourceTotals;

  /**
   * Whether to show system totals section
   * @default true
   */
  showSystemTotals?: boolean;

  /**
   * Whether to enable sorting
   * @default true
   */
  enableSorting?: boolean;

  /**
   * Initial sort column
   * @default 'usagePercent'
   */
  initialSortColumn?: SortColumn;

  /**
   * Initial sort direction
   * @default 'desc'
   */
  initialSortDirection?: SortDirection;

  /**
   * Whether to show only running instances
   * @default false
   */
  showOnlyRunning?: boolean;

  /**
   * Callback when an instance row is clicked
   */
  onInstanceClick?: (instance: ServiceInstanceResource) => void;

  /**
   * Force a specific platform variant
   */
  variant?: 'mobile' | 'desktop';

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Whether data is currently loading
   * @default false
   */
  isLoading?: boolean;

  /**
   * Empty state message
   */
  emptyMessage?: string;
}

/**
 * Extended instance data with computed fields
 */
export interface EnhancedServiceInstanceResource extends ServiceInstanceResource {
  /**
   * Usage percentage (0-100)
   */
  usagePercent: number;

  /**
   * Usage status based on thresholds
   */
  usageStatus: UsageStatus;
}
