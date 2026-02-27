import type {
  ServiceInstanceHealth,
  ConfigureHealthCheckInput,
} from '@nasnet/api-client/generated/types';
/**
 * GraphQL mutation for configuring health check settings
 */
export declare const CONFIGURE_HEALTH_CHECK_MUTATION: import('graphql').DocumentNode;
/**
 * Hook to configure health check settings for a service instance
 *
 * @returns Mutation function and result
 *
 * @example
 * ```tsx
 * const [configureHealthCheck, { loading, error }] = useConfigureHealthCheck();
 *
 * const handleSave = async () => {
 *   try {
 *     await configureHealthCheck({
 *       variables: {
 *         input: {
 *           instanceID: 'inst-123',
 *           intervalSeconds: 60,
 *           failureThreshold: 5,
 *           autoRestart: true,
 *         },
 *       },
 *     });
 *     toast.success('Health check settings updated');
 *   } catch (err) {
 *     toast.error('Failed to update settings');
 *   }
 * };
 * ```
 */
export declare function useConfigureHealthCheck(): import('@apollo/client').MutationTuple<
  {
    configureHealthCheck: ServiceInstanceHealth;
  },
  {
    input: ConfigureHealthCheckInput;
  },
  import('@apollo/client').DefaultContext,
  import('@apollo/client').ApolloCache<any>
>;
/**
 * Validation helper for health check configuration
 */
export declare function validateHealthCheckConfig(
  config: Partial<ConfigureHealthCheckInput>
): string[];
//# sourceMappingURL=useConfigureHealthCheck.d.ts.map
