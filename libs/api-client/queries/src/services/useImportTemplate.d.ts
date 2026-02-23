/**
 * useImportTemplate Hook
 *
 * Mutation hook for importing service templates from JSON.
 */
import type { ServiceTemplate, ImportServiceTemplateInput } from '@nasnet/api-client/generated';
/**
 * Options for useImportTemplate hook
 */
export interface UseImportTemplateOptions {
    /**
     * Callback invoked on successful import
     */
    onCompleted?: (template: ServiceTemplate) => void;
    /**
     * Callback invoked on error (e.g., validation failure)
     */
    onError?: (error: Error) => void;
}
/**
 * Return type for useImportTemplate hook
 */
export interface UseImportTemplateReturn {
    /**
     * Mutation function to import a template from JSON
     */
    importTemplate: (input: ImportServiceTemplateInput) => Promise<ServiceTemplate>;
    /**
     * Loading state
     */
    loading: boolean;
    /**
     * Error object if mutation failed (e.g., invalid JSON, validation errors)
     */
    error: Error | undefined;
    /**
     * Imported template data
     */
    template: ServiceTemplate | undefined;
    /**
     * Reset mutation state
     */
    reset: () => void;
}
/**
 * Hook to import a service template from JSON data
 *
 * Validates the template structure and creates a new custom template.
 * Throws validation errors if template format is invalid.
 *
 * @example
 * ```tsx
 * const { importTemplate, loading, error } = useImportTemplate({
 *   onCompleted: (template) => {
 *     toast.success(`Template "${template.name}" imported`);
 *   },
 *   onError: (error) => {
 *     toast.error(`Import failed: ${error.message}`);
 *   },
 * });
 *
 * // Import from uploaded file
 * const fileContent = await file.text();
 * const templateData = JSON.parse(fileContent);
 *
 * await importTemplate({
 *   routerID: 'router-1',
 *   templateData,
 * });
 * ```
 */
export declare function useImportTemplate(options?: UseImportTemplateOptions): UseImportTemplateReturn;
//# sourceMappingURL=useImportTemplate.d.ts.map