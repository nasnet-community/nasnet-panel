/**
 * InstanceManager Types
 *
 * TypeScript interfaces for the InstanceManager pattern component.
 * Manages installed service instances with filtering, search, and bulk operations.
 */

import type { ReactNode } from 'react';
import type { Service, ServiceStatus, ServiceCategory } from '../service-card/types';

/**
 * Filter configuration
 */
export interface InstanceFilters {
  /** Text search query */
  search: string;
  /** Category filter */
  category: ServiceCategory | 'all';
  /** Status filter */
  status: ServiceStatus | 'all';
}

/**
 * Bulk operation type
 */
export type BulkOperation = 'start' | 'stop' | 'restart' | 'delete';

/**
 * Bulk action configuration
 */
export interface BulkAction {
  /** Operation type */
  operation: BulkOperation;
  /** Display label */
  label: string;
  /** Icon component */
  icon?: ReactNode;
  /** Variant for styling */
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  /** Confirmation required */
  requiresConfirmation?: boolean;
}

/**
 * Sort configuration
 */
export interface InstanceSort {
  /** Field to sort by */
  field: 'name' | 'status' | 'category' | 'cpu' | 'memory';
  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * View mode for instance display
 */
export type ViewMode = 'grid' | 'list';

/**
 * InstanceManager component props
 */
export interface InstanceManagerProps {
  /** List of service instances */
  instances: Service[];
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: string | null;
  /** Selected instance IDs */
  selectedIds?: string[];
  /** Selection change handler */
  onSelectionChange?: (ids: string[]) => void;
  /** Instance click handler */
  onInstanceClick?: (instance: Service) => void;
  /** Bulk operation handler */
  onBulkOperation?: (operation: BulkOperation, instanceIds: string[]) => void;
  /** Filters */
  filters?: InstanceFilters;
  /** Filter change handler */
  onFiltersChange?: (filters: InstanceFilters) => void;
  /** Sort configuration */
  sort?: InstanceSort;
  /** Sort change handler */
  onSortChange?: (sort: InstanceSort) => void;
  /** View mode */
  viewMode?: ViewMode;
  /** View mode change handler */
  onViewModeChange?: (mode: ViewMode) => void;
  /** Whether to show resource metrics */
  showMetrics?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Custom empty state */
  emptyState?: ReactNode;
}
