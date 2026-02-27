/**
 * useTemplateBrowser Hook
 * NAS-18.12: Alert Rule Templates Feature
 *
 * Headless hook for AlertTemplateBrowser component.
 * Provides filtering, sorting, searching, and selection for alert rule templates.
 *
 * @see ADR-018: Headless Platform Presenters
 */

import { useMemo, useCallback, useState } from 'react';
import type {
  AlertRuleTemplate,
  AlertRuleTemplateCategory,
} from '../../schemas/alert-rule-template.schema';

// =============================================================================
// Types
// =============================================================================

/**
 * Template filter criteria
 */
export interface TemplateFilter {
  /** Search by name or description */
  search?: string;

  /** Filter by category */
  category?: AlertRuleTemplateCategory | 'all';

  /** Filter by severity */
  severity?: 'CRITICAL' | 'WARNING' | 'INFO' | 'all';

  /** Show only built-in templates */
  builtInOnly?: boolean;

  /** Show only custom templates */
  customOnly?: boolean;
}

/**
 * Template sort field
 */
export type TemplateSortField = 'name' | 'severity' | 'category' | 'updatedAt';

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Template sort configuration
 */
export interface TemplateSort {
  field: TemplateSortField;
  direction: SortDirection;
}

/**
 * Template selection state
 */
export interface TemplateSelection {
  /** Currently selected template ID */
  selectedId: string | null;

  /** Selected template object */
  selectedTemplate: AlertRuleTemplate | null;
}

/**
 * Hook options
 */
export interface UseTemplateBrowserOptions {
  /** Templates to display */
  templates: AlertRuleTemplate[];

  /** Initial filter state */
  initialFilter?: Partial<TemplateFilter>;

  /** Initial sort state */
  initialSort?: TemplateSort;

  /** Callback when template is selected */
  onSelect?: (template: AlertRuleTemplate) => void;

  /** Callback when template is applied */
  onApply?: (template: AlertRuleTemplate) => void;

  /** Initially selected template ID */
  initialSelectedId?: string | null;
}

/**
 * Hook return value
 * @description Provides all state and actions for managing alert template browser.
 * Includes filtered/sorted templates, filter controls, sort controls, selection state,
 * and metadata counters for UI rendering.
 */
export interface UseTemplateBrowserReturn {
  /** Filtered and sorted templates based on current filter/sort state */
  filteredTemplates: AlertRuleTemplate[];

  /** Total number of templates (unfiltered) */
  totalCount: number;

  /** Number of templates after applying filters */
  filteredCount: number;

  /** Current filter criteria object */
  filter: TemplateFilter;

  /** Update filter with partial object merge */
  setFilter: (filter: Partial<TemplateFilter>) => void;

  /** Clear all filters to defaults */
  clearFilter: () => void;

  /** Whether any filter is currently active */
  hasActiveFilter: boolean;

  /** Current sort configuration (field + direction) */
  sort: TemplateSort;

  /** Set sort field (toggles direction if same field selected) */
  setSort: (field: TemplateSortField) => void;

  /** Toggle sort direction (asc <-> desc) */
  toggleSortDirection: () => void;

  /** Current template selection state */
  selection: TemplateSelection;

  /** Select a template or null to deselect */
  selectTemplate: (template: AlertRuleTemplate | null) => void;

  /** Clear current selection */
  clearSelection: () => void;

  /** Apply selected template (triggers onApply callback) */
  applyTemplate: (template: AlertRuleTemplate) => void;

  /** Count of templates per category */
  categoryCount: Record<string, number>;

  /** Count of templates per severity level */
  severityCount: Record<string, number>;
}

// =============================================================================
// Constants
// =============================================================================

/**
 * Default filter values
 */
const DEFAULT_FILTER: TemplateFilter = {
  search: '',
  category: 'all',
  severity: 'all',
  builtInOnly: false,
  customOnly: false,
};

/**
 * Default sort configuration
 */
const DEFAULT_SORT: TemplateSort = {
  field: 'name',
  direction: 'asc',
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Filter templates based on criteria
 */
function filterTemplates(
  templates: AlertRuleTemplate[],
  filter: TemplateFilter
): AlertRuleTemplate[] {
  return templates.filter((template) => {
    // Search filter (name or description)
    if (filter.search && filter.search.trim() !== '') {
      const searchLower = filter.search.toLowerCase();
      const matchesName = template.name.toLowerCase().includes(searchLower);
      const matchesDesc = template.description.toLowerCase().includes(searchLower);

      if (!matchesName && !matchesDesc) {
        return false;
      }
    }

    // Category filter
    if (filter.category && filter.category !== 'all') {
      if (template.category !== filter.category) {
        return false;
      }
    }

    // Severity filter
    if (filter.severity && filter.severity !== 'all') {
      if (template.severity !== filter.severity) {
        return false;
      }
    }

    // Built-in only filter
    if (filter.builtInOnly && !template.isBuiltIn) {
      return false;
    }

    // Custom only filter
    if (filter.customOnly && template.isBuiltIn) {
      return false;
    }

    return true;
  });
}

/**
 * Sort templates by field and direction
 */
function sortTemplates(templates: AlertRuleTemplate[], sort: TemplateSort): AlertRuleTemplate[] {
  const { field, direction } = sort;
  const multiplier = direction === 'asc' ? 1 : -1;

  return [...templates].sort((a, b) => {
    let aVal: string | number | Date | null;
    let bVal: string | number | Date | null;

    switch (field) {
      case 'name':
        aVal = a.name;
        bVal = b.name;
        break;
      case 'severity': {
        // Order: CRITICAL > WARNING > INFO
        const severityOrder: Record<string, number> = { CRITICAL: 3, WARNING: 2, INFO: 1 };
        aVal = severityOrder[a.severity];
        bVal = severityOrder[b.severity];
        break;
      }
      case 'category':
        aVal = a.category;
        bVal = b.category;
        break;
      case 'updatedAt':
        aVal = a.updatedAt ? new Date(a.updatedAt) : null;
        bVal = b.updatedAt ? new Date(b.updatedAt) : null;
        break;
      default:
        aVal = a.name;
        bVal = b.name;
    }

    // Handle null/undefined values (push to end)
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;

    // String comparison
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return multiplier * aVal.localeCompare(bVal);
    }

    // Numeric comparison
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return multiplier * (aVal - bVal);
    }

    // Date comparison
    if (aVal instanceof Date && bVal instanceof Date) {
      return multiplier * (aVal.getTime() - bVal.getTime());
    }

    return 0;
  });
}

/**
 * Calculate category counts for templates
 */
function calculateCategoryCounts(templates: AlertRuleTemplate[]): Record<string, number> {
  const counts: Record<string, number> = {};

  templates.forEach((template) => {
    counts[template.category] = (counts[template.category] || 0) + 1;
  });

  return counts;
}

/**
 * Calculate severity counts for templates
 */
function calculateSeverityCounts(templates: AlertRuleTemplate[]): Record<string, number> {
  const counts: Record<string, number> = {};

  templates.forEach((template) => {
    counts[template.severity] = (counts[template.severity] || 0) + 1;
  });

  return counts;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Headless hook for alert template browser logic
 *
 * @description Provides filtering, sorting, searching, and selection for alert rule templates.
 * Platform-agnostic business logic without any rendering concerns.
 * All state is memoized to prevent unnecessary re-renders of consuming components.
 *
 * @param options - Configuration options (templates, initial filters, callbacks)
 * @returns Template browser state and actions for UI rendering
 *
 * @example
 * ```tsx
 * const browser = useTemplateBrowser({
 *   templates: alertTemplates,
 *   initialFilter: { category: 'NETWORK' },
 *   onSelect: (template) => console.log('Selected:', template.name),
 *   onApply: (template) => applyTemplateMutation(template),
 * });
 *
 * // Use in presenter component
 * return (
 *   <div>
 *     <SearchInput onChange={(search) => browser.setFilter({ search })} />
 *     <TemplateList
 *       templates={browser.filteredTemplates}
 *       onSelect={browser.selectTemplate}
 *     />
 *   </div>
 * );
 * ```
 */
export function useTemplateBrowser(options: UseTemplateBrowserOptions): UseTemplateBrowserReturn {
  const {
    templates,
    initialFilter = {},
    initialSort = DEFAULT_SORT,
    onSelect,
    onApply,
    initialSelectedId = null,
  } = options;

  // Filter state
  const [filter, setFilterState] = useState<TemplateFilter>({
    ...DEFAULT_FILTER,
    ...initialFilter,
  });

  // Sort state
  const [sort, setSortState] = useState<TemplateSort>(initialSort);

  // Selection state
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);

  // Filter and sort templates (memoized)
  const filteredTemplates = useMemo(() => {
    const filtered = filterTemplates(templates, filter);
    return sortTemplates(filtered, sort);
  }, [templates, filter, sort]);

  // Check if filter is active
  const hasActiveFilter = useMemo(() => {
    return (
      (filter.search !== undefined && filter.search.trim() !== '') ||
      (filter.category !== undefined && filter.category !== 'all') ||
      (filter.severity !== undefined && filter.severity !== 'all') ||
      filter.builtInOnly === true ||
      filter.customOnly === true
    );
  }, [filter]);

  // Calculate counts (memoized)
  const categoryCount = useMemo(() => calculateCategoryCounts(templates), [templates]);

  const severityCount = useMemo(() => calculateSeverityCounts(templates), [templates]);

  // Get selected template
  const selectedTemplate = useMemo(() => {
    if (!selectedId) return null;
    return templates.find((t) => t.id === selectedId) || null;
  }, [selectedId, templates]);

  // Update filter
  const setFilter = useCallback((newFilter: Partial<TemplateFilter>) => {
    setFilterState((prev) => ({ ...prev, ...newFilter }));
  }, []);

  // Clear filter
  const clearFilter = useCallback(() => {
    setFilterState(DEFAULT_FILTER);
  }, []);

  // Set sort field (toggles direction if same field)
  const setSort = useCallback((field: TemplateSortField) => {
    setSortState((prev) => {
      if (prev.field === field) {
        // Toggle direction
        return {
          field,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      // New field, default to ascending
      return { field, direction: 'asc' };
    });
  }, []);

  // Toggle sort direction
  const toggleSortDirection = useCallback(() => {
    setSortState((prev) => ({
      ...prev,
      direction: prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  // Select template
  const selectTemplate = useCallback(
    (template: AlertRuleTemplate | null) => {
      const newId = template ? template.id : null;
      setSelectedId(newId);

      if (template && onSelect) {
        onSelect(template);
      }
    },
    [onSelect]
  );

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedId(null);
  }, []);

  // Apply template
  const applyTemplate = useCallback(
    (template: AlertRuleTemplate) => {
      if (onApply) {
        onApply(template);
      }
    },
    [onApply]
  );

  return {
    // Data
    filteredTemplates,
    totalCount: templates.length,
    filteredCount: filteredTemplates.length,

    // Filter
    filter,
    setFilter,
    clearFilter,
    hasActiveFilter,

    // Sort
    sort,
    setSort,
    toggleSortDirection,

    // Selection
    selection: {
      selectedId,
      selectedTemplate,
    },
    selectTemplate,
    clearSelection,

    // Actions
    applyTemplate,

    // Metadata
    categoryCount,
    severityCount,
  };
}
