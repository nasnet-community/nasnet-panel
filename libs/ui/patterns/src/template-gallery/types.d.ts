/**
 * Template Gallery Types
 *
 * Types for the TemplateGallery pattern component.
 * Provides filtering, sorting, and selection for firewall templates.
 */
export type { FirewallTemplate, TemplateCategory, TemplateComplexity, TemplateVariable, TemplateRule, } from '@nasnet/core/types';
import type { FirewallTemplate, TemplateCategory, TemplateComplexity } from '@nasnet/core/types';
/**
 * Template filter criteria
 */
export interface TemplateFilter {
    /** Search by name or description */
    search?: string;
    /** Filter by category */
    category?: TemplateCategory | 'all';
    /** Filter by complexity */
    complexity?: TemplateComplexity | 'all';
    /** Show only built-in templates */
    builtInOnly?: boolean;
    /** Show only custom templates */
    customOnly?: boolean;
}
/**
 * Template sort field
 */
export type TemplateSortField = 'name' | 'complexity' | 'ruleCount' | 'category' | 'updatedAt';
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
    selectedTemplate: FirewallTemplate | null;
}
/**
 * Complexity level metadata
 */
export interface ComplexityMeta {
    label: string;
    description: string;
    color: string;
    icon: string;
}
/**
 * Category metadata
 */
export interface CategoryMeta {
    label: string;
    description: string;
    icon: string;
}
//# sourceMappingURL=types.d.ts.map