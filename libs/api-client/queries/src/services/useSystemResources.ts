/**
 * useSystemResources Hook
 *
 * Apollo Client hook for querying system resource budgeting and allocation.
 * Part of the resource budgeting feature for service instance management.
 *
 * @module @nasnet/api-client/queries/services
 */

import {
  gql,
  useQuery,
  useMutation,
  useSubscription,
  type QueryHookOptions,
  type MutationHookOptions,
  type SubscriptionHookOptions,
} from '@apollo/client';
import type {
  SystemResources,
  InstanceResourceUsage,
  ResourceUsage,
  ResourceLimits,
  ResourceRequirements,
  ResourceStatus,
  SetResourceLimitsInput,
  ResourceLimitsPayload,
} from '@nasnet/api-client/generated';

/**
 * GraphQL query for system resources
 * Fetches complete resource allocation state including per-instance usage
 */
export const GET_SYSTEM_RESOURCES = gql`
  query GetSystemResources($routerID: ID!) {
    systemResources(routerID: $routerID) {
      totalRAM
      availableRAM
      allocatedRAM
      instances {
        instanceID
        instanceName
        featureID
        requirements {
          minRAM
          recommendedRAM
          cpuWeight
        }
        usage {
          currentMB
          limitMB
          usagePercent
          status
        }
      }
    }
  }
`;

/**
 * GraphQL mutation for setting resource limits
 * Updates memory and CPU resource constraints for a service instance
 */
export const SET_RESOURCE_LIMITS = gql`
  mutation SetResourceLimits($input: SetResourceLimitsInput!) {
    setResourceLimits(input: $input) {
      success
      resourceLimits {
        memoryMB
        cpuPercent
        applied
      }
      errors {
        field
        message
      }
    }
  }
`;

/**
 * GraphQL subscription for real-time resource usage updates
 * Streams resource usage changes for a specific instance
 */
export const SUBSCRIBE_RESOURCE_USAGE = gql`
  subscription ResourceUsageChanged($routerID: ID!, $instanceID: ID!) {
    resourceUsageChanged(routerID: $routerID, instanceID: $instanceID) {
      currentMB
      limitMB
      usagePercent
      status
    }
  }
`;

/**
 * Variables for GET_SYSTEM_RESOURCES query
 */
export interface GetSystemResourcesVariables {
  routerID: string;
}

/**
 * Result type for GET_SYSTEM_RESOURCES query
 */
export interface GetSystemResourcesResult {
  systemResources: SystemResources;
}

/**
 * Variables for SET_RESOURCE_LIMITS mutation
 */
export interface SetResourceLimitsVariables {
  input: SetResourceLimitsInput;
}

/**
 * Result type for SET_RESOURCE_LIMITS mutation
 */
export interface SetResourceLimitsResult {
  setResourceLimits: ResourceLimitsPayload;
}

/**
 * Variables for SUBSCRIBE_RESOURCE_USAGE subscription
 */
export interface ResourceUsageChangedVariables {
  routerID: string;
  instanceID: string;
}

/**
 * Result type for SUBSCRIBE_RESOURCE_USAGE subscription
 */
export interface ResourceUsageChangedResult {
  resourceUsageChanged: ResourceUsage;
}

/**
 * Hook for querying system resource allocation and usage.
 *
 * Polls every 10 seconds by default to track resource consumption changes.
 * Uses cache-and-network policy for fresh data while maintaining responsive UI.
 *
 * @param routerID - Router ID to query resources for
 * @param options - Apollo query options
 * @returns Query result with system resources
 *
 * @example
 * ```tsx
 * function ResourceBudgetPanel({ routerID }) {
 *   const { data, loading, error, refetch } = useSystemResources(routerID);
 *
 *   if (loading) return <Spinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *
 *   const resources = data?.systemResources;
 *   const utilizationPercent = (resources.allocatedRAM / resources.totalRAM) * 100;
 *
 *   return (
 *     <Card>
 *       <ResourceUsageBar
 *         label="System RAM"
 *         current={resources.allocatedRAM}
 *         limit={resources.totalRAM}
 *         unit="MB"
 *       />
 *       <Text>Available: {resources.availableRAM}MB</Text>
 *       {resources.instances.map(instance => (
 *         <InstanceResourceCard key={instance.instanceID} instance={instance} />
 *       ))}
 *     </Card>
 *   );
 * }
 * ```
 */
export function useSystemResources(
  routerID: string,
  options?: QueryHookOptions<GetSystemResourcesResult, GetSystemResourcesVariables>
) {
  return useQuery<GetSystemResourcesResult, GetSystemResourcesVariables>(GET_SYSTEM_RESOURCES, {
    variables: { routerID },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    pollInterval: 10000, // Poll every 10 seconds
    ...options,
  });
}

/**
 * Hook for setting resource limits on a service instance.
 *
 * Includes optimistic updates for immediate UI feedback.
 * Triggers refetch of system resources after successful mutation.
 *
 * @param options - Apollo mutation options
 * @returns Mutation tuple [mutate, result]
 *
 * @example
 * ```tsx
 * function ResourceLimitForm({ routerID, instanceID, currentLimits }) {
 *   const [setLimits, { loading, error }] = useSetResourceLimits();
 *   const form = useForm({
 *     defaultValues: {
 *       memoryMB: currentLimits.memoryMB,
 *       cpuWeight: currentLimits.cpuWeight,
 *     },
 *   });
 *
 *   const handleSubmit = async (values) => {
 *     const result = await setLimits({
 *       variables: {
 *         input: {
 *           routerID,
 *           instanceID,
 *           memoryMB: values.memoryMB,
 *           cpuWeight: values.cpuWeight,
 *         },
 *       },
 *     });
 *
 *     if (result.data?.setResourceLimits.success) {
 *       toast.success('Resource limits updated');
 *     } else {
 *       const errors = result.data?.setResourceLimits.errors ?? [];
 *       toast.error(errors[0]?.message ?? 'Failed to update limits');
 *     }
 *   };
 *
 *   return (
 *     <Form onSubmit={form.handleSubmit(handleSubmit)}>
 *       <Input
 *         label="Memory Limit (MB)"
 *         type="number"
 *         min={16}
 *         {...form.register('memoryMB')}
 *       />
 *       <Input
 *         label="CPU Weight"
 *         type="number"
 *         min={0}
 *         max={100}
 *         {...form.register('cpuWeight')}
 *       />
 *       <Button type="submit" disabled={loading}>
 *         {loading ? 'Saving...' : 'Save Limits'}
 *       </Button>
 *     </Form>
 *   );
 * }
 * ```
 */
export function useSetResourceLimits(
  options?: MutationHookOptions<SetResourceLimitsResult, SetResourceLimitsVariables>
) {
  return useMutation<SetResourceLimitsResult, SetResourceLimitsVariables>(SET_RESOURCE_LIMITS, {
    refetchQueries: ['GetSystemResources'],
    awaitRefetchQueries: false,
    // Optimistic response for immediate UI feedback
    optimisticResponse: (vars) => ({
      setResourceLimits: {
        __typename: 'ResourceLimitsPayload',
        success: true,
        resourceLimits: {
          __typename: 'ResourceLimits',
          memoryMB: vars.input.memoryMB,
          cpuPercent: vars.input.cpuWeight ?? null,
          applied: true,
        },
        errors: [],
      },
    }),
    ...options,
  });
}

/**
 * Hook for subscribing to real-time resource usage changes.
 *
 * Streams resource usage updates for a specific instance.
 * Automatically reconnects on connection loss.
 *
 * @param routerID - Router ID to subscribe to
 * @param instanceID - Instance ID to monitor
 * @param options - Apollo subscription options
 * @returns Subscription result with resource usage updates
 *
 * @example
 * ```tsx
 * function ResourceMonitor({ routerID, instanceID }) {
 *   const { data, loading, error } = useResourceUsageSubscription(
 *     routerID,
 *     instanceID
 *   );
 *
 *   useEffect(() => {
 *     if (data?.resourceUsageChanged) {
 *       const usage = data.resourceUsageChanged;
 *
 *       // Show warning toast if usage is high
 *       if (usage.status === 'WARNING') {
 *         toast.warning(`Resource usage at ${usage.usagePercent}%`);
 *       }
 *
 *       // Show critical alert if usage is critical
 *       if (usage.status === 'CRITICAL') {
 *         toast.error(`Critical resource usage: ${usage.usagePercent}%`);
 *       }
 *     }
 *   }, [data]);
 *
 *   if (loading) return <Spinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *
 *   const usage = data?.resourceUsageChanged;
 *   if (!usage) return null;
 *
 *   return (
 *     <ResourceUsageBar
 *       current={usage.currentMB}
 *       limit={usage.limitMB}
 *       status={usage.status}
 *       label="Live Memory Usage"
 *     />
 *   );
 * }
 * ```
 */
export function useResourceUsageSubscription(
  routerID: string,
  instanceID: string,
  options?: SubscriptionHookOptions<ResourceUsageChangedResult, ResourceUsageChangedVariables>
) {
  return useSubscription<ResourceUsageChangedResult, ResourceUsageChangedVariables>(
    SUBSCRIBE_RESOURCE_USAGE,
    {
      variables: { routerID, instanceID },
      shouldResubscribe: true, // Reconnect on connection loss
      ...options,
    }
  );
}

// Re-export types for convenience
export type {
  SystemResources,
  InstanceResourceUsage,
  ResourceUsage,
  ResourceLimits,
  ResourceRequirements,
  ResourceStatus,
  SetResourceLimitsInput,
  ResourceLimitsPayload,
};
