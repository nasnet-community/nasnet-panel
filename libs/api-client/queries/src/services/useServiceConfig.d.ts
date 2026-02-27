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
export declare function useServiceConfigSchema(serviceType: string): {
  schema: ConfigSchema | undefined;
  loading: boolean;
  error: import('@apollo/client').ApolloError | undefined;
  refetch: (
    variables?: Partial<import('@apollo/client').OperationVariables> | undefined
  ) => Promise<import('@apollo/client').ApolloQueryResult<any>>;
};
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
export declare function useInstanceConfig(
  routerID: string,
  instanceID: string
): {
  config: Record<string, unknown> | undefined;
  loading: boolean;
  error: import('@apollo/client').ApolloError | undefined;
  refetch: (
    variables?: Partial<import('@apollo/client').OperationVariables> | undefined
  ) => Promise<import('@apollo/client').ApolloQueryResult<any>>;
};
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
export declare function useValidateServiceConfig(): {
  validateConfig: (input: ValidateServiceConfigInput) => Promise<ConfigValidationResult>;
  loading: boolean;
  error: import('@apollo/client').ApolloError | undefined;
};
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
export declare function useApplyServiceConfig(): {
  applyConfig: (input: ApplyServiceConfigInput) => Promise<ApplyConfigPayload>;
  loading: boolean;
  error: import('@apollo/client').ApolloError | undefined;
};
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
export declare function useServiceConfigOperations(
  serviceType: string,
  routerID: string,
  instanceID: string
): {
  schema: ConfigSchema | undefined;
  config: Record<string, unknown> | undefined;
  validateConfig: (input: ValidateServiceConfigInput) => Promise<ConfigValidationResult>;
  applyConfig: (input: ApplyServiceConfigInput) => Promise<ApplyConfigPayload>;
  refetchSchema: (
    variables?: Partial<import('@apollo/client').OperationVariables> | undefined
  ) => Promise<import('@apollo/client').ApolloQueryResult<any>>;
  refetchConfig: (
    variables?: Partial<import('@apollo/client').OperationVariables> | undefined
  ) => Promise<import('@apollo/client').ApolloQueryResult<any>>;
  loading: {
    schema: boolean;
    config: boolean;
    validating: boolean;
    applying: boolean;
  };
  errors: {
    schema: import('@apollo/client').ApolloError | undefined;
    config: import('@apollo/client').ApolloError | undefined;
    validation: import('@apollo/client').ApolloError | undefined;
    application: import('@apollo/client').ApolloError | undefined;
  };
};
//# sourceMappingURL=useServiceConfig.d.ts.map
