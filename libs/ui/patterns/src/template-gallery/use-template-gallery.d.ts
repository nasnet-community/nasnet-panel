/**
 * useTemplateGallery Hook
 *
 * Headless hook for TemplateGallery pattern component.
 * Provides filtering, sorting, searching, and selection for firewall templates.
 *
 * @see ADR-018: Headless Platform Presenters
 */
import type { FirewallTemplate, TemplateFilter, TemplateSort, TemplateSortField, TemplateSelection } from './types';
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
    filteredTemplates: FirewallTemplate[];
    totalCount: number;
    filteredCount: number;
    filter: TemplateFilter;
    setFilter: (filter: Partial<TemplateFilter>) => void;
    clearFilter: () => void;
    hasActiveFilter: boolean;
    sort: TemplateSort;
    setSort: (field: TemplateSortField) => void;
    toggleSortDirection: () => void;
    selection: TemplateSelection;
    selectTemplate: (template: FirewallTemplate | null) => void;
    clearSelection: () => void;
    categoryCount: Record<string, number>;
    complexityCount: Record<string, number>;
}
/**
 * Headless hook for template gallery logic
 */
export declare function useTemplateGallery(options: UseTemplateGalleryOptions): UseTemplateGalleryReturn;
//# sourceMappingURL=use-template-gallery.d.ts.map