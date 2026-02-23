import type { UseFormReturn } from 'react-hook-form';
import type { ConfigSchema, ConfigSchemaField } from '@nasnet/api-client/generated';
/**
 * Props for useServiceConfigForm hook
 */
export interface UseServiceConfigFormProps {
    /** Service type (e.g., 'tor', 'sing-box', 'xray') */
    serviceType: string;
    /** Router ID */
    routerID: string;
    /** Service instance ID */
    instanceID: string;
    /** Callback when configuration is successfully applied */
    onSuccess?: (configPath?: string) => void;
    /** Callback when configuration fails to apply */
    onError?: (message: string) => void;
}
/**
 * Return type for useServiceConfigForm hook
 */
export interface UseServiceConfigFormReturn {
    /** Configuration schema from backend */
    schema: ConfigSchema | undefined;
    /** React Hook Form instance */
    form: UseFormReturn<any>;
    /** Visible fields based on conditional logic */
    visibleFields: ConfigSchemaField[];
    /** Submit handler - validates and applies configuration */
    handleSubmit: () => Promise<void>;
    /** Validation state */
    isValidating: boolean;
    /** Submit state */
    isSubmitting: boolean;
    /** Loading states */
    loading: {
        schema: boolean;
        config: boolean;
    };
    /** Errors */
    errors: {
        schema: Error | undefined;
        config: Error | undefined;
    };
    /** Manually trigger validation */
    validate: () => Promise<boolean>;
    /** Refetch schema and config */
    refetch: () => void;
}
/**
 * Headless hook for service configuration forms with React Hook Form integration
 *
 * This hook provides:
 * - Schema fetching from backend
 * - Current config loading
 * - Dynamic Zod schema generation
 * - React Hook Form integration with zodResolver
 * - Conditional field visibility (evaluates showIf conditions)
 * - Validation before submit
 * - Atomic config application
 *
 * @example
 * ```tsx
 * function ServiceConfigForm({ serviceType, routerID, instanceID }) {
 *   const {
 *     schema,
 *     form,
 *     visibleFields,
 *     handleSubmit,
 *     isSubmitting,
 *     loading,
 *   } = useServiceConfigForm({
 *     serviceType,
 *     routerID,
 *     instanceID,
 *     onSuccess: () => toast.success('Configuration applied!'),
 *     onError: (msg) => toast.error(msg),
 *   });
 *
 *   if (loading.schema || loading.config) {
 *     return <Spinner />;
 *   }
 *
 *   return (
 *     <form onSubmit={form.handleSubmit(handleSubmit)}>
 *       {visibleFields.map(field => (
 *         <DynamicField key={field.name} field={field} form={form} />
 *       ))}
 *       <Button type="submit" disabled={isSubmitting}>
 *         Apply Configuration
 *       </Button>
 *     </form>
 *   );
 * }
 * ```
 */
export declare function useServiceConfigForm({ serviceType, routerID, instanceID, onSuccess, onError, }: UseServiceConfigFormProps): UseServiceConfigFormReturn;
//# sourceMappingURL=useServiceConfigForm.d.ts.map