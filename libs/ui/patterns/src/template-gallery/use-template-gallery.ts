/**
 * useTemplateGallery Hook
 *
 * Headless hook for TemplateGallery pattern component.
 * Provides filtering, sorting, searching, and selection for firewall templates.
 *
 * @see ADR-018: Headless Platform Presenters
 */

import { useMemo, useCallback, useState } from 'react';

import type {
  FirewallTemplate,
  TemplateFilter,
  TemplateSort,
  TemplateSortField,
  SortDirection,
  TemplateSelection,
} from './types';

export interface UseTemplateGalleryOptions {
  /** Templates to display */
  templates: FirewallTemplate[];

  /** Initial filter state */
  initialFilter?: Partial<TemplateFilter>;

  /** Initial sort state */
  initialSort?: TemplateSort;

  /** Callback when template is selected */
  onSelect?: (template: FirewallTemplate) => void;

  /** Initially selected template ID */
  initialSelectedId?: string | null;
}

export interface UseTemplateGalleryReturn {
  // Filtered and sorted data
  filteredTemplates: FirewallTemplate[];
  totalCount: number;
  filteredCount: number;

  // Filter state
  filter: TemplateFilter;
  setFilter: (filter: Partial<TemplateFilter>) => void;
  clearFilter: () => void;
  hasActiveFilter: boolean;

  // Sort state
  sort: TemplateSort;
  setSort: (field: TemplateSortField) => void;
  toggleSortDirection: () => void;

  // Selection state
  selection: TemplateSelection;
  selectTemplate: (template: FirewallTemplate | null) => void;
  clearSelection: () => void;

  // Computed metadata
  categoryCount: Record<string, number>;
  complexityCount: Record<string, number>;
}

/**
 * Default filter values
 */
const DEFAULT_FILTER: TemplateFilter = {
  search: '',
  category: 'all',
  complexity: 'all',
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

/**
 * Filter templates based on criteria
 */
function filterTemplates(
  templates: FirewallTemplate[],
  filter: TemplateFilter
): FirewallTemplate[] {
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

    // Complexity filter
    if (filter.complexity && filter.complexity !== 'all') {
      if (template.complexity !== filter.complexity) {
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
function sortTemplates(
  templates: FirewallTemplate[],
  sort: TemplateSort
): FirewallTemplate[] {
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
      case 'complexity':
        // Order: SIMPLE < MODERATE < ADVANCED
        const complexityOrder = { SIMPLE: 1, MODERATE: 2, ADVANCED: 3 };
        aVal = complexityOrder[a.complexity];
        bVal = complexityOrder[b.complexity];
        break;
      case 'ruleCount':
        aVal = a.ruleCount;
        bVal = b.ruleCount;
        break;
      case 'category':
        aVal = a.category;
        bVal = b.category;
        break;
      case 'updatedAt':
        aVal = a.updatedAt;
        bVal = b.updatedAt;
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
function calculateCategoryCounts(templates: FirewallTemplate[]): Record<string, number> {
  const counts: Record<string, number> = {};

  templates.forEach((template) => {
    counts[template.category] = (counts[template.category] || 0) + 1;
  });

  return counts;
}

/**
 * Calculate complexity counts for templates
 */
function calculateComplexityCounts(templates: FirewallTemplate[]): Record<string, number> {
  const counts: Record<string, number> = {};

  templates.forEach((template) => {
    counts[template.complexity] = (counts[template.complexity] || 0) + 1;
  });

  return counts;
}

/**
 * Headless hook for template gallery logic
 */
export function useTemplateGallery(
  options: UseTemplateGalleryOptions
): UseTemplateGalleryReturn {
  const {
    templates,
    initialFilter = {},
    initialSort = DEFAULT_SORT,
    onSelect,
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
      (filter.complexity !== undefined && filter.complexity !== 'all') ||
      filter.builtInOnly === true ||
      filter.customOnly === true
    );
  }, [filter]);

  // Calculate counts (memoized)
  const categoryCount = useMemo(
    () => calculateCategoryCounts(templates),
    [templates]
  );

  const complexityCount = useMemo(
    () => calculateComplexityCounts(templates),
    [templates]
  );

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
  const setSort = useCallback(
    (field: TemplateSortField) => {
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
    },
    []
  );

  // Toggle sort direction
  const toggleSortDirection = useCallback(() => {
    setSortState((prev) => ({
      ...prev,
      direction: prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  // Select template
  const selectTemplate = useCallback(
    (template: FirewallTemplate | null) => {
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

    // Metadata
    categoryCount,
    complexityCount,
  };
}
