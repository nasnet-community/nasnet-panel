/**
 * Firewall Templates Query Hooks
 * NAS-7.6: Firewall Templates Feature
 *
 * Provides TanStack Query hooks for fetching and managing firewall templates.
 * Supports built-in templates, custom templates, preview, and apply operations.
 */
import { type UseQueryResult } from '@tanstack/react-query';
import type { FirewallTemplate, TemplatePreviewResult } from '@nasnet/core/types';
/**
 * Template list filters
 */
export interface TemplateFilters {
    category?: string;
    complexity?: string;
}
/**
 * Preview template input
 */
export interface PreviewTemplateInput {
    routerId: string;
    templateId: string;
    variables: Record<string, string>;
}
/**
 * Apply template input
 */
export interface ApplyTemplateInput {
    routerId: string;
    templateId: string;
    variables: Record<string, string>;
}
/**
 * Rollback template input
 */
export interface RollbackTemplateInput {
    routerId: string;
    rollbackId: string;
}
/**
 * Hook to fetch all firewall templates
 *
 * @param filters - Optional filters for category and complexity
 * @param options - Query options
 * @returns Query result with FirewallTemplate[] data
 *
 * @example
 * ```tsx
 * const { data: templates, isLoading } = useTemplates({
 *   category: 'HOME',
 *   complexity: 'SIMPLE',
 * });
 * ```
 */
interface UseTemplatesOptions {
    filters?: TemplateFilters;
    enabled?: boolean;
}
export declare function useTemplates(options?: UseTemplatesOptions): UseQueryResult<FirewallTemplate[], Error>;
/**
 * Hook to fetch a specific template by ID
 *
 * @param templateId - Template ID to fetch
 * @param options - Query options
 * @returns Query result with FirewallTemplate data
 *
 * @example
 * ```tsx
 * const { data: template } = useTemplate('basic-security');
 * ```
 */
interface UseTemplateOptions {
    enabled?: boolean;
}
export declare function useTemplate(templateId: string | null, options?: UseTemplateOptions): UseQueryResult<FirewallTemplate, Error>;
/**
 * Hook to preview a template with variable resolution
 *
 * @param input - Preview input (routerId, templateId, variables)
 * @param options - Query options
 * @returns Query result with TemplatePreviewResult data
 *
 * @example
 * ```tsx
 * const { data: preview, isLoading } = usePreviewTemplate({
 *   routerId: '192.168.88.1',
 *   templateId: 'basic-security',
 *   variables: { LAN_INTERFACE: 'bridge1' },
 * });
 * ```
 */
interface UsePreviewTemplateOptions {
    enabled?: boolean;
}
export declare function usePreviewTemplate(input: PreviewTemplateInput | null, options?: UsePreviewTemplateOptions): UseQueryResult<TemplatePreviewResult, Error>;
/**
 * Hook to apply a firewall template
 *
 * Automatically invalidates related queries to refresh UI after apply.
 *
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const applyMutation = useApplyTemplate();
 *
 * await applyMutation.mutateAsync({
 *   routerId: '192.168.88.1',
 *   templateId: 'basic-security',
 *   variables: { LAN_INTERFACE: 'bridge1' },
 * });
 * ```
 */
export declare function useApplyTemplate(): import("@tanstack/react-query").UseMutationResult<{
    errors: readonly string[];
    isSuccessful: boolean;
    appliedRulesCount: number;
    rollbackId: string;
}, Error, ApplyTemplateInput, unknown>;
/**
 * Hook to rollback a template application
 *
 * Automatically invalidates queries to refresh UI after rollback.
 *
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const rollbackMutation = useRollbackTemplate();
 *
 * await rollbackMutation.mutateAsync({
 *   routerId: '192.168.88.1',
 *   rollbackId: 'rollback-123456',
 * });
 * ```
 */
export declare function useRollbackTemplate(): import("@tanstack/react-query").UseMutationResult<void, Error, RollbackTemplateInput, unknown>;
export {};
//# sourceMappingURL=templates.d.ts.map