/**
 * useSystemResources Hook
 *
 * Apollo Client hook for querying system resource budgeting and allocation.
 * Part of the resource budgeting feature for service instance management.
 *
 * @module @nasnet/api-client/queries/services
 */
import {
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
export declare const GET_SYSTEM_RESOURCES: import('graphql').DocumentNode;
/**
 * GraphQL mutation for setting resource limits
 * Updates memory and CPU resource constraints for a service instance
 */
export declare const SET_RESOURCE_LIMITS: import('graphql').DocumentNode;
/**
 * GraphQL subscription for real-time resource usage updates
 * Streams resource usage changes for a specific instance
 */
export declare const SUBSCRIBE_RESOURCE_USAGE: import('graphql').DocumentNode;
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
export declare function useSystemResources(
  routerID: string,
  options?: QueryHookOptions<GetSystemResourcesResult, GetSystemResourcesVariables>
): import('@apollo/client').InteropQueryResult<
  GetSystemResourcesResult,
  GetSystemResourcesVariables
>;
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
export declare function useSetResourceLimits(
  options?: MutationHookOptions<SetResourceLimitsResult, SetResourceLimitsVariables>
): import('@apollo/client').MutationTuple<
  SetResourceLimitsResult,
  SetResourceLimitsVariables,
  import('@apollo/client').DefaultContext,
  import('@apollo/client').ApolloCache<any>
>;
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
export declare function useResourceUsageSubscription(
  routerID: string,
  instanceID: string,
  options?: SubscriptionHookOptions<ResourceUsageChangedResult, ResourceUsageChangedVariables>
): {
  restart: () => void;
  loading: boolean;
  data?: ResourceUsageChangedResult | undefined;
  error?: import('@apollo/client').ApolloError;
  variables?: ResourceUsageChangedVariables | undefined;
};
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
//# sourceMappingURL=useSystemResources.d.ts.map
