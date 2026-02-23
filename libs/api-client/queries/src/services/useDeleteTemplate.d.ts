/**
 * useDeleteTemplate Hook
 *
 * Mutation hook for deleting user-created service templates.
 */
/**
 * Input for deleting a template
 */
export interface DeleteTemplateInput {
    /**
     * Router ID
     */
    routerID: string;
    /**
     * Template ID to delete
     */
    templateID: string;
}
/**
 * Options for useDeleteTemplate hook
 */
export interface UseDeleteTemplateOptions {
    /**
     * Callback invoked on successful deletion
     */
    onCompleted?: () => void;
    /**
     * Callback invoked on error
     */
    onError?: (error: Error) => void;
}
/**
 * Return type for useDeleteTemplate hook
 */
export interface UseDeleteTemplateReturn {
    /**
     * Mutation function to delete a template
     */
    deleteTemplate: (input: DeleteTemplateInput) => Promise<boolean>;
    /**
     * Loading state
     */
    loading: boolean;
    /**
     * Error object if mutation failed
     */
    error: Error | undefined;
    /**
     * Reset mutation state
     */
    reset: () => void;
}
/**
 * Hook to delete a user-created service template
 *
 * Note: Built-in templates cannot be deleted and will return an error.
 *
 * @example
 * ```tsx
 * const { deleteTemplate, loading } = useDeleteTemplate({
 *   onCompleted: () => {
 *     toast.success('Template deleted');
 *   },
 *   onError: (error) => {
 *     toast.error(`Delete failed: ${error.message}`);
 *   },
 * });
 *
 * await deleteTemplate({
 *   routerID: 'router-1',
 *   templateID: 'template-123',
 * });
 * ```
 */
export declare function useDeleteTemplate(options?: UseDeleteTemplateOptions): UseDeleteTemplateReturn;
//# sourceMappingURL=useDeleteTemplate.d.ts.map