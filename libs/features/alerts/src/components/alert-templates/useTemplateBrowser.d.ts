/**
 * useTemplateBrowser Hook
 * NAS-18.12: Alert Rule Templates Feature
 *
 * Headless hook for AlertTemplateBrowser component.
 * Provides filtering, sorting, searching, and selection for alert rule templates.
 *
 * @see ADR-018: Headless Platform Presenters
 */
import type { AlertRuleTemplate, AlertRuleTemplateCategory } from '../../schemas/alert-rule-template.schema';
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
export declare function useTemplateBrowser(options: UseTemplateBrowserOptions): UseTemplateBrowserReturn;
//# sourceMappingURL=useTemplateBrowser.d.ts.map