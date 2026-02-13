import { useMutation, useApolloClient } from '@apollo/client';
import { INSTALL_SERVICE, GET_SERVICE_INSTANCES } from './services.graphql';

/**
 * Input for installing a new service instance
 */
export interface InstallServiceInput {
  routerID: string;
  featureID: string;
  instanceName: string;
  config?: unknown;
  vlanID?: number;
  bindIP?: string;
}

/**
 * Hook for installing a new service instance on a router
 *
 * Triggers binary download, checksum verification, and instance creation.
 * Automatically invalidates the service instances cache after successful installation.
 *
 * Installation is a long-running operation - use `useInstallProgress` subscription
 * to track download progress in real-time.
 *
 * @returns Mutation function, loading state, error, and data
 *
 * @example
 * ```tsx
 * const [installService, { loading, error, data }] = useInstallService();
 *
 * const handleInstall = async () => {
 *   try {
 *     const result = await installService({
 *       variables: {
 *         input: {
 *           routerID: 'router-1',
 *           featureID: 'tor',
 *           instanceName: 'Tor Exit Node',
 *           config: { exitPolicy: 'accept *:80' },
 *           vlanID: 100,
 *         },
 *       },
 *     });
 *
 *     if (result.data?.installService.instance) {
 *       toast.success('Installation started');
 *     }
 *   } catch (err) {
 *     toast.error('Installation failed');
 *   }
 * };
 * ```
 */
export function useInstallService() {
  const client = useApolloClient();

  return useMutation(INSTALL_SERVICE, {
    // Update function for cache management
    update(cache, { data }) {
      if (!data?.installService.instance) return;

      const newInstance = data.installService.instance;
      const routerId = newInstance.routerID;

      // Read existing instances from cache
      try {
        const existingData = cache.readQuery<{ serviceInstances: unknown[] }>({
          query: GET_SERVICE_INSTANCES,
          variables: { routerID: routerId },
        });

        // If we have cached data, append the new instance
        if (existingData?.serviceInstances) {
          cache.writeQuery({
            query: GET_SERVICE_INSTANCES,
            variables: { routerID: routerId },
            data: {
              serviceInstances: [...existingData.serviceInstances, newInstance],
            },
          });
        }
      } catch (error) {
        // Cache read failed - likely no cached data yet
        // This is fine, next query will fetch fresh data
      }
    },

    // Also refetch instances query to ensure consistency
    refetchQueries: [
      {
        query: GET_SERVICE_INSTANCES,
        variables: (result) => ({
          routerID: result.data?.installService.instance?.routerID,
        }),
      },
    ],

    // Optimistic response for immediate UI feedback
    optimisticResponse: (vars) => ({
      installService: {
        instance: {
          id: `temp-${Date.now()}`, // Temporary ID
          featureID: vars.input.featureID,
          instanceName: vars.input.instanceName,
          routerID: vars.input.routerID,
          status: 'INSTALLING' as const,
          vlanID: vars.input.vlanID ?? null,
          bindIP: vars.input.bindIP ?? null,
          ports: [],
          config: vars.input.config ?? null,
          binaryPath: null,
          binaryVersion: null,
          binaryChecksum: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          __typename: 'ServiceInstance' as const,
        },
        errors: [],
        __typename: 'ServiceInstancePayload' as const,
      },
    }),
  });
}

/**
 * Type-safe wrapper for the install mutation variables
 */
export type InstallServiceVariables = {
  input: InstallServiceInput;
};
