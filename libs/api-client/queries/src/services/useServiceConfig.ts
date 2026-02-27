import { useQuery, useMutation, useApolloClient } from '@apollo/client';
import {
  GET_SERVICE_CONFIG_SCHEMA,
  GET_INSTANCE_CONFIG,
  VALIDATE_SERVICE_CONFIG,
  APPLY_SERVICE_CONFIG,
} from './service-config.graphql';
import type {
  ConfigSchema,
  ApplyServiceConfigInput,
  ValidateServiceConfigInput,
  ConfigValidationResult,
  ApplyConfigPayload,
} from '@nasnet/api-client/generated';

/**
 * Hook to get configuration schema for a service type
 *
 * @example
 * ```tsx
 * const { schema, loading, error } = useServiceConfigSchema('tor');
 *
 * if (schema) {
 *   schema.fields.forEach(field => {
 *     console.log(`${field.label}: ${field.type}`);
 *   });
 * }
 * ```
 */
export function useServiceConfigSchema(serviceType: string) {
  const { data, loading, error, refetch } = useQuery(GET_SERVICE_CONFIG_SCHEMA, {
    variables: { serviceType },
    skip: !serviceType,
  });

  return {
    schema: data?.serviceConfigSchema as ConfigSchema | undefined,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook to get current configuration for a service instance
 *
 * @example
 * ```tsx
 * const { config, loading, error } = useInstanceConfig('router-1', 'instance-123');
 *
 * if (config) {
 *   console.log('Current config:', config);
 * }
 * ```
 */
export function useInstanceConfig(routerID: string, instanceID: string) {
  const { data, loading, error, refetch } = useQuery(GET_INSTANCE_CONFIG, {
    variables: { routerID, instanceID },
    skip: !routerID || !instanceID,
  });

  return {
    config: data?.instanceConfig as Record<string, unknown> | undefined,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook for validating service configuration
 *
 * @example
 * ```tsx
 * const { validateConfig, loading, error } = useValidateServiceConfig();
 *
 * const result = await validateConfig({
 *   routerID: 'router-1',
 *   instanceID: 'instance-123',
 *   config: { port: 9050, exitPolicy: 'accept *:80' }
 * });
 *
 * if (!result.valid) {
 *   result.errors.forEach(err => {
 *     console.error(`${err.field}: ${err.message}`);
 *   });
 * }
 * ```
 */
export function useValidateServiceConfig() {
  const [validateMutation, { loading, error }] = useMutation(VALIDATE_SERVICE_CONFIG);

  const validateConfig = async (
    input: ValidateServiceConfigInput
  ): Promise<ConfigValidationResult> => {
    const result = await validateMutation({ variables: { input } });
    return result.data?.validateServiceConfig as ConfigValidationResult;
  };

  return {
    validateConfig,
    loading,
    error,
  };
}

/**
 * Hook for applying service configuration
 *
 * @example
 * ```tsx
 * const { applyConfig, loading, error } = useApplyServiceConfig();
 *
 * const result = await applyConfig({
 *   routerID: 'router-1',
 *   instanceID: 'instance-123',
 *   config: { port: 9050, exitPolicy: 'accept *:80' }
 * });
 *
 * if (result.success) {
 *   toast.success('Configuration applied successfully!');
 * } else {
 *   toast.error(result.message);
 * }
 * ```
 */
export function useApplyServiceConfig() {
  const client = useApolloClient();
  const [applyMutation, { loading, error }] = useMutation(APPLY_SERVICE_CONFIG, {
    onCompleted: (data) => {
      if (data?.applyServiceConfig?.success) {
        // Invalidate instance config cache to show updated values
        client.refetchQueries({
          include: [GET_INSTANCE_CONFIG],
        });
      }
    },
  });

  const applyConfig = async (input: ApplyServiceConfigInput): Promise<ApplyConfigPayload> => {
    const result = await applyMutation({ variables: { input } });
    return result.data?.applyServiceConfig as ApplyConfigPayload;
  };

  return {
    applyConfig,
    loading,
    error,
  };
}

/**
 * Combined hook providing all service configuration operations
 *
 * @example
 * ```tsx
 * const {
 *   schema,
 *   config,
 *   validateConfig,
 *   applyConfig,
 *   loading,
 *   errors
 * } = useServiceConfigOperations('tor', 'router-1', 'instance-123');
 *
 * // Get schema and current config
 * if (schema && config) {
 *   // Render form
 * }
 *
 * // Validate before applying
 * const validation = await validateConfig({ ...input });
 * if (validation.valid) {
 *   await applyConfig({ ...input });
 * }
 * ```
 */
export function useServiceConfigOperations(
  serviceType: string,
  routerID: string,
  instanceID: string
) {
  const schemaQuery = useServiceConfigSchema(serviceType);
  const configQuery = useInstanceConfig(routerID, instanceID);
  const validation = useValidateServiceConfig();
  const application = useApplyServiceConfig();

  return {
    // Schema
    schema: schemaQuery.schema,
    // Current config
    config: configQuery.config,
    // Operations
    validateConfig: validation.validateConfig,
    applyConfig: application.applyConfig,
    // Refetch functions
    refetchSchema: schemaQuery.refetch,
    refetchConfig: configQuery.refetch,
    // Loading states
    loading: {
      schema: schemaQuery.loading,
      config: configQuery.loading,
      validating: validation.loading,
      applying: application.loading,
    },
    // Errors
    errors: {
      schema: schemaQuery.error,
      config: configQuery.error,
      validation: validation.error,
      application: application.error,
    },
  };
}
