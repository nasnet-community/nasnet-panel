/**
 * Alert Rule Templates Apollo Client Hooks
 * NAS-18.12: Alert Rule Templates Feature
 *
 * React hooks for querying and mutating alert rule templates using Apollo Client.
 * Provides type-safe interfaces for all template operations.
 */
import type { AlertRuleTemplate, AlertRuleTemplatePreview, AlertRuleTemplateCategory } from '../schemas/alert-rule-template.schema';
/**
 * GraphQL response types
 */
interface GetAlertRuleTemplatesResponse {
    alertRuleTemplates: AlertRuleTemplate[];
}
interface GetAlertRuleTemplateByIdResponse {
    alertRuleTemplate: AlertRuleTemplate | null;
}
interface PreviewAlertRuleTemplateResponse {
    previewAlertRuleTemplate: {
        preview: AlertRuleTemplatePreview | null;
        errors: Array<{
            field: string;
            message: string;
        }>;
    };
}
interface ApplyAlertRuleTemplateResponse {
    applyAlertRuleTemplate: {
        alertRule: {
            id: string;
            name: string;
            description: string;
            eventType: string;
            conditions: Array<{
                field: string;
                operator: string;
                value: string;
            }>;
            severity: string;
            channels: string[];
            throttle: {
                maxAlerts: number;
                periodSeconds: number;
                groupByField?: string;
            } | null;
            enabled: boolean;
            createdAt: string;
            updatedAt: string;
        } | null;
        errors: Array<{
            field: string;
            message: string;
        }>;
    };
}
interface SaveCustomAlertRuleTemplateResponse {
    saveCustomAlertRuleTemplate: {
        template: AlertRuleTemplate | null;
        errors: Array<{
            field: string;
            message: string;
        }>;
    };
}
interface DeleteCustomAlertRuleTemplateResponse {
    deleteCustomAlertRuleTemplate: {
        success: boolean;
        deletedId: string | null;
        errors: Array<{
            field: string;
            message: string;
        }>;
    };
}
interface ImportAlertRuleTemplateResponse {
    importAlertRuleTemplate: {
        template: AlertRuleTemplate | null;
        errors: Array<{
            field: string;
            message: string;
        }>;
    };
}
interface ExportAlertRuleTemplateResponse {
    exportAlertRuleTemplate: string;
}
/**
 * Hook options
 */
interface UseAlertRuleTemplatesOptions {
    category?: AlertRuleTemplateCategory;
    enabled?: boolean;
    pollInterval?: number;
}
interface UseAlertRuleTemplateOptions {
    enabled?: boolean;
}
interface UsePreviewTemplateOptions {
    enabled?: boolean;
}
/**
 * Hook to fetch all alert rule templates with optional category filtering.
 *
 * @description Fetches alert rule templates with optional category filtering,
 * supports polling and automatic cache-and-network refresh strategy.
 *
 * @param options - Query options and filters
 * @returns Query result with AlertRuleTemplate[] data
 *
 * @example
 * ```tsx
 * const { data, loading, error } = useAlertRuleTemplates({
 *   category: 'NETWORK',
 * });
 * ```
 */
export declare function useAlertRuleTemplates(options?: UseAlertRuleTemplatesOptions): import("@apollo/client").InteropQueryResult<GetAlertRuleTemplatesResponse, import("@apollo/client").OperationVariables>;
/**
 * Hook to fetch a single alert rule template by ID.
 *
 * @description Fetches a specific alert rule template. Query is skipped if ID
 * is not provided. Uses cache-first strategy for stable templates.
 *
 * @param id - Template ID (null to skip query)
 * @param options - Query options
 * @returns Query result with AlertRuleTemplate data
 *
 * @example
 * ```tsx
 * const { data, loading } = useAlertRuleTemplate('router-offline-alert');
 * ```
 */
export declare function useAlertRuleTemplate(id: string | null, options?: UseAlertRuleTemplateOptions): import("@apollo/client").InteropQueryResult<GetAlertRuleTemplateByIdResponse, import("@apollo/client").OperationVariables>;
/**
 * Hook to preview a template with variable substitution.
 *
 * @description Previews a template with provided variables for substitution.
 * Uses no-cache strategy to always fetch fresh preview data. Skips query if
 * templateId is not provided.
 *
 * @param templateId - Template ID to preview (null to skip)
 * @param variables - Variables for template resolution
 * @param options - Query options
 * @returns Query result with AlertRuleTemplatePreview data
 *
 * @example
 * ```tsx
 * const { data, loading } = usePreviewAlertRuleTemplate(
 *   'high-cpu-alert',
 *   { CPU_THRESHOLD: 80, DURATION_SECONDS: 300 }
 * );
 * ```
 */
export declare function usePreviewAlertRuleTemplate(templateId: string | null, variables: Record<string, unknown>, options?: UsePreviewTemplateOptions): import("@apollo/client").InteropQueryResult<PreviewAlertRuleTemplateResponse, import("@apollo/client").OperationVariables>;
/**
 * Hook to apply a template and create an alert rule.
 *
 * @description Applies a template to create a new alert rule with optional
 * customizations. Automatically refetches alert rules after successful
 * application.
 *
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const [applyTemplate, { loading, error }] = useApplyAlertRuleTemplate();
 *
 * await applyTemplate({
 *   variables: {
 *     templateId: 'router-offline-alert',
 *     variables: { OFFLINE_DURATION: 60 },
 *     customizations: {
 *       name: 'My Router Offline Alert',
 *       enabled: true,
 *     },
 *   },
 * });
 * ```
 */
export declare function useApplyAlertRuleTemplate(): import("@apollo/client").MutationTuple<ApplyAlertRuleTemplateResponse, import("@apollo/client").OperationVariables, import("@apollo/client").DefaultContext, import("@apollo/client").ApolloCache<any>>;
/**
 * Hook to save a custom alert rule template.
 *
 * @description Saves a custom alert rule template. Automatically refetches
 * template list after successful save to reflect new template in UI.
 *
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const [saveTemplate, { loading, error }] = useSaveCustomAlertRuleTemplate();
 *
 * await saveTemplate({
 *   variables: {
 *     input: {
 *       name: 'My Custom Template',
 *       description: 'Custom alert for my use case',
 *       category: 'CUSTOM',
 *       eventType: 'router.offline',
 *       severity: 'CRITICAL',
 *       conditions: [
 *         { field: 'status', operator: 'EQUALS', value: 'offline' }
 *       ],
 *       channels: ['email'],
 *       variables: [
 *         { name: 'DURATION', label: 'Duration', type: 'DURATION', required: true }
 *       ],
 *     },
 *   },
 * });
 * ```
 */
export declare function useSaveCustomAlertRuleTemplate(): import("@apollo/client").MutationTuple<SaveCustomAlertRuleTemplateResponse, import("@apollo/client").OperationVariables, import("@apollo/client").DefaultContext, import("@apollo/client").ApolloCache<any>>;
/**
 * Hook to delete a custom alert rule template.
 *
 * @description Deletes a custom template. Automatically refetches template
 * list after successful deletion to remove template from UI.
 *
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const [deleteTemplate, { loading, error }] = useDeleteCustomAlertRuleTemplate();
 *
 * await deleteTemplate({
 *   variables: { id: 'custom-template-123' },
 * });
 * ```
 */
export declare function useDeleteCustomAlertRuleTemplate(): import("@apollo/client").MutationTuple<DeleteCustomAlertRuleTemplateResponse, import("@apollo/client").OperationVariables, import("@apollo/client").DefaultContext, import("@apollo/client").ApolloCache<any>>;
/**
 * Hook to import an alert rule template from JSON.
 *
 * @description Imports an alert rule template from JSON data.
 * Automatically refetches template list after successful import.
 *
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const [importTemplate, { loading, error }] = useImportAlertRuleTemplate();
 *
 * const templateJson = JSON.stringify({
 *   name: 'Imported Template',
 *   description: 'Template imported from file',
 *   // ... other template fields
 * });
 *
 * await importTemplate({
 *   variables: { json: templateJson },
 * });
 * ```
 */
export declare function useImportAlertRuleTemplate(): import("@apollo/client").MutationTuple<ImportAlertRuleTemplateResponse, import("@apollo/client").OperationVariables, import("@apollo/client").DefaultContext, import("@apollo/client").ApolloCache<any>>;
/**
 * Hook to export an alert rule template as JSON.
 *
 * @description Exports an alert rule template as JSON string for
 * download or sharing.
 *
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const [exportTemplate, { data, loading }] = useExportAlertRuleTemplate();
 *
 * const handleExport = async () => {
 *   const result = await exportTemplate({
 *     variables: { id: 'router-offline-alert' },
 *   });
 *
 *   if (result.data) {
 *     const json = result.data.exportAlertRuleTemplate;
 *     // Download JSON file
 *     const blob = new Blob([json], { type: 'application/json' });
 *     const url = URL.createObjectURL(blob);
 *     // ... trigger download
 *   }
 * };
 * ```
 */
export declare function useExportAlertRuleTemplate(): import("@apollo/client").MutationTuple<ExportAlertRuleTemplateResponse, import("@apollo/client").OperationVariables, import("@apollo/client").DefaultContext, import("@apollo/client").ApolloCache<any>>;
export {};
//# sourceMappingURL=useAlertRuleTemplates.d.ts.map