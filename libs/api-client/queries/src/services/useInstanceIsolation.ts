/**
 * useInstanceIsolation Hook
 *
 * Apollo Client hook for querying service instance isolation status.
 * Part of the service isolation security feature (NAS-8.4).
 *
 * @module @nasnet/api-client/queries/services
 */

import { gql, useQuery, useMutation, type QueryHookOptions, type MutationHookOptions } from '@apollo/client';
import type { IsolationStatus, ResourceLimits, ResourceLimitsInput } from '@nasnet/api-client/generated';

/**
 * GraphQL query for instance isolation status
 * Fetches complete isolation verification results including violations and resource limits
 */
export const GET_INSTANCE_ISOLATION = gql`
  query GetInstanceIsolation($routerID: ID!, $instanceID: ID!) {
    instanceIsolation(routerID: $routerID, instanceID: $instanceID) {
      checkedAt
      violations {
        layer
        message
        details
        severity
      }
      resourceLimits {
        cpuPercent
        memoryMB
        diskMB
        networkMbps
      }
    }
  }
`;

/**
 * GraphQL mutation for setting resource limits
 * Updates resource constraints for a service instance
 */
export const SET_RESOURCE_LIMITS = gql`
  mutation SetResourceLimits($routerID: ID!, $instanceID: ID!, $memoryMB: Int!, $cpuWeight: Int) {
    setResourceLimits(input: { routerID: $routerID, instanceID: $instanceID, memoryMB: $memoryMB, cpuWeight: $cpuWeight }) {
      success
      message
      resourceLimits {
        memoryMB
        cpuPercent
        applied
      }
    }
  }
`;

/**
 * Variables for GET_INSTANCE_ISOLATION query
 */
export interface GetInstanceIsolationVariables {
  routerID: string;
  instanceID: string;
}

/**
 * Result type for GET_INSTANCE_ISOLATION query
 */
export interface GetInstanceIsolationResult {
  instanceIsolation: IsolationStatus;
}

/**
 * Variables for SET_RESOURCE_LIMITS mutation
 */
export interface SetResourceLimitsVariables {
  routerID: string;
  instanceID: string;
  memoryMB: number;
  cpuWeight?: number;
}

/**
 * Result type for SET_RESOURCE_LIMITS mutation
 */
export interface SetResourceLimitsResult {
  setResourceLimits: {
    success: boolean;
    message: string;
    resourceLimits: ResourceLimits | null;
  };
}

/**
 * Hook for querying instance isolation status.
 *
 * Polls every 5 seconds by default to catch isolation violations in real-time.
 * Uses cache-and-network policy for fresh data while maintaining fast UI.
 *
 * @param routerID - Router ID
 * @param instanceID - Service instance ID
 * @param options - Apollo query options
 * @returns Query result with isolation status
 *
 * @example
 * ```tsx
 * function IsolationPanel({ routerID, instanceID }) {
 *   const { data, loading, error, refetch } = useInstanceIsolation(routerID, instanceID);
 *
 *   if (loading) return <Spinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *
 *   const isolation = data?.instanceIsolation;
 *   const hasViolations = isolation.violations.length > 0;
 *
 *   return (
 *     <Card>
 *       <IsolationStatus isolation={isolation} instanceId={instanceID} />
 *       {hasViolations && <Alert severity="error">Isolation violations detected</Alert>}
 *       <Button onClick={() => refetch()}>Refresh</Button>
 *     </Card>
 *   );
 * }
 * ```
 */
export function useInstanceIsolation(
  routerID: string,
  instanceID: string,
  options?: QueryHookOptions<
    GetInstanceIsolationResult,
    GetInstanceIsolationVariables
  >
) {
  return useQuery<
    GetInstanceIsolationResult,
    GetInstanceIsolationVariables
  >(GET_INSTANCE_ISOLATION, {
    variables: { routerID, instanceID },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    pollInterval: 5000, // Poll every 5 seconds
    ...options,
  });
}

/**
 * Hook for setting resource limits on a service instance.
 *
 * Triggers a refetch of isolation status after successful mutation.
 *
 * @param options - Apollo mutation options
 * @returns Mutation tuple [mutate, result]
 *
 * @example
 * ```tsx
 * function ResourceLimitEditor({ routerID, instanceID }) {
 *   const [setLimits, { loading }] = useSetResourceLimits();
 *
 *   const handleSave = async (limits: ResourceLimitsInput) => {
 *     const result = await setLimits({
 *       variables: {
 *         input: { routerID, instanceID },
 *         limits,
 *       },
 *     });
 *
 *     if (result.data?.setResourceLimits.success) {
 *       toast.success('Resource limits updated');
 *     } else {
 *       toast.error(result.data?.setResourceLimits.message ?? 'Failed to update limits');
 *     }
 *   };
 *
 *   return (
 *     <Form onSubmit={handleSave}>
 *       <Input name="cpuPercent" type="number" />
 *       <Input name="memoryMB" type="number" />
 *       <Button type="submit" disabled={loading}>Save</Button>
 *     </Form>
 *   );
 * }
 * ```
 */
export function useSetResourceLimits(
  options?: MutationHookOptions<
    SetResourceLimitsResult,
    SetResourceLimitsVariables
  >
) {
  return useMutation<
    SetResourceLimitsResult,
    SetResourceLimitsVariables
  >(SET_RESOURCE_LIMITS, {
    refetchQueries: ['GetInstanceIsolation'],
    ...options,
  });
}
