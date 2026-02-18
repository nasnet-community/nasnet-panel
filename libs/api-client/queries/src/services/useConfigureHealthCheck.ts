import { useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import type {
  ServiceInstanceHealth,
  ConfigureHealthCheckInput
} from '@nasnet/api-client/generated/types';

/**
 * GraphQL mutation for configuring health check settings
 */
export const CONFIGURE_HEALTH_CHECK_MUTATION = gql`
  mutation ConfigureHealthCheck($input: ConfigureHealthCheckInput!) {
    configureHealthCheck(input: $input) {
      status
      processAlive
      connectionStatus
      latencyMs
      lastHealthy
      consecutiveFails
      uptimeSeconds
    }
  }
`;

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
export function useConfigureHealthCheck() {
  return useMutation<
    { configureHealthCheck: ServiceInstanceHealth },
    { input: ConfigureHealthCheckInput }
  >(CONFIGURE_HEALTH_CHECK_MUTATION, {
    // Refetch instance health after configuration change
    refetchQueries: ['InstanceHealth'],
  });
}

/**
 * Validation helper for health check configuration
 */
export function validateHealthCheckConfig(config: Partial<ConfigureHealthCheckInput>): string[] {
  const errors: string[] = [];

  const interval = config.intervalSeconds;
  if (interval != null) {
    if (interval < 10 || interval > 300) {
      errors.push('Check interval must be between 10 and 300 seconds');
    }
  }

  const threshold = config.failureThreshold;
  if (threshold != null) {
    if (threshold < 1 || threshold > 10) {
      errors.push('Failure threshold must be between 1 and 10');
    }
  }

  return errors;
}
