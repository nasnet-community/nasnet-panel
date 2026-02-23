/**
 * useServiceTemplates Hook
 *
 * Query hook for fetching service templates with filtering.
 */
import type { ServiceTemplate, ServiceTemplateCategory, TemplateScope } from '@nasnet/api-client/generated';
/**
 * Options for useServiceTemplates hook
 */
export interface UseServiceTemplatesOptions {
    /**
     * Router ID (null for built-in templates only)
     */
    routerID?: string | null;
    /**
     * Filter by category
     */
    category?: ServiceTemplateCategory;
    /**
     * Filter by scope
     */
    scope?: TemplateScope;
    /**
     * Text search query (filters client-side by name, description, tags)
     */
    searchQuery?: string;
    /**
     * Whether to include built-in templates (default: true)
     */
    includeBuiltIn?: boolean;
    /**
     * Whether to include custom templates (default: true)
     */
    includeCustom?: boolean;
}
/**
 * Return type for useServiceTemplates hook
 */
export interface UseServiceTemplatesReturn {
    /**
     * Array of service templates
     */
    templates: ServiceTemplate[];
    /**
     * Loading state
     */
    loading: boolean;
    /**
     * Error object if query failed
     */
    error: Error | undefined;
    /**
     * Refetch function to manually reload data
     */
    refetch: () => Promise<unknown>;
}
/**
 * Hook to fetch service templates with filtering
 *
 * Templates are fetched with cache-first policy since they change infrequently.
 * Use refetch() to manually reload if needed.
 *
 * @example
 * ```tsx
 * const { templates, loading, error } = useServiceTemplates({
 *   routerID: 'router-1',
 *   category: 'PRIVACY',
 *   searchQuery: 'tor',
 * });
 * ```
 */
export declare function useServiceTemplates(options?: UseServiceTemplatesOptions): UseServiceTemplatesReturn;
//# sourceMappingURL=useServiceTemplates.d.ts.map