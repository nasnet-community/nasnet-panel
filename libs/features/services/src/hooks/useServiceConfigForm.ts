import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { UseFormReturn } from 'react-hook-form';
import {
  useServiceConfigOperations,
  type ConfigSchema,
  type ConfigSchemaField,
} from '@nasnet/api-client/queries';
import { buildZodSchema, evaluateCondition } from '../utils';

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
export function useServiceConfigForm({
  serviceType,
  routerID,
  instanceID,
  onSuccess,
  onError,
}: UseServiceConfigFormProps): UseServiceConfigFormReturn {
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch schema, config, and operations
  const {
    schema,
    config,
    validateConfig,
    applyConfig,
    refetchSchema,
    refetchConfig,
    loading,
    errors,
  } = useServiceConfigOperations(serviceType, routerID, instanceID);

  // Build Zod schema from backend ConfigSchema
  const zodSchema = useMemo(() => {
    if (!schema) return undefined;
    try {
      return buildZodSchema(schema);
    } catch (error) {
      console.error('Failed to build Zod schema:', error);
      return undefined;
    }
  }, [schema]);

  // Initialize React Hook Form
  const form = useForm({
    resolver: zodSchema ? zodResolver(zodSchema) : undefined,
    mode: 'onBlur', // Validate on blur for better UX
    defaultValues: {},
  });

  // Populate form with current config when it loads
  useEffect(() => {
    if (config && schema) {
      // Build default values from schema + current config
      const defaultValues: Record<string, any> = {};

      for (const field of schema.fields) {
        if (config[field.name] !== undefined) {
          // Use current config value
          defaultValues[field.name] = config[field.name];
        } else if (field.defaultValue !== undefined && field.defaultValue !== null) {
          // Use schema default value
          defaultValues[field.name] = field.defaultValue;
        } else {
          // Fallback based on field type
          defaultValues[field.name] = getTypeDefaultValue(field.type);
        }
      }

      form.reset(defaultValues);
    }
  }, [config, schema, form]);

  // Watch form values for conditional visibility
  const formValues = form.watch();

  // Calculate visible fields based on showIf conditions
  const visibleFields = useMemo(() => {
    if (!schema) return [];

    return schema.fields.filter((field) => {
      // If no condition, always visible
      if (!field.showIf) return true;

      // Evaluate condition
      return evaluateCondition(field.showIf, formValues);
    });
  }, [schema, formValues]);

  /**
   * Manually trigger validation
   */
  const validate = async (): Promise<boolean> => {
    setIsValidating(true);
    try {
      const formData = form.getValues();

      // First: client-side validation with Zod
      const clientValid = await form.trigger();
      if (!clientValid) {
        setIsValidating(false);
        return false;
      }

      // Second: server-side validation
      const result = await validateConfig({
        routerID,
        instanceID,
        config: formData,
      });

      if (!result.valid) {
        // Set server-side errors on form fields
        result.errors?.forEach((err) => {
          form.setError(err.field, {
            type: 'server',
            message: err.message,
          });
        });
        setIsValidating(false);
        return false;
      }

      setIsValidating(false);
      return true;
    } catch (error) {
      console.error('Validation error:', error);
      setIsValidating(false);
      return false;
    }
  };

  /**
   * Submit handler - validates and applies configuration
   */
  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Validate first
      const isValid = await validate();
      if (!isValid) {
        setIsSubmitting(false);
        return;
      }

      // Apply configuration
      const formData = form.getValues();
      const result = await applyConfig({
        routerID,
        instanceID,
        config: formData,
      });

      if (result.success) {
        onSuccess?.(result.configPath ?? undefined);
      } else {
        // Set field-level errors if provided
        result.errors?.forEach((err) => {
          form.setError(err.field, {
            type: 'server',
            message: err.message,
          });
        });
        onError?.(result.message ?? 'Configuration failed to apply');
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error occurred';
      onError?.(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Refetch schema and config
   */
  const refetch = () => {
    refetchSchema();
    refetchConfig();
  };

  return {
    schema,
    form,
    visibleFields,
    handleSubmit,
    isValidating,
    isSubmitting,
    loading: {
      schema: loading.schema,
      config: loading.config,
    },
    errors: {
      schema: errors.schema,
      config: errors.config,
    },
    validate,
    refetch,
  };
}

/**
 * Get default value for a field type
 */
function getTypeDefaultValue(type: string): any {
  switch (type) {
    case 'TOGGLE':
      return false;
    case 'NUMBER':
    case 'PORT':
      return 0;
    case 'MULTI_SELECT':
    case 'TEXT_ARRAY':
      return [];
    case 'TEXT':
    case 'TEXT_AREA':
    case 'PASSWORD':
    case 'EMAIL':
    case 'URL':
    case 'IP_ADDRESS':
    case 'FILE_PATH':
    case 'SELECT':
    default:
      return '';
  }
}
