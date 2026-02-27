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
export declare function useInstallService(): import('@apollo/client').MutationTuple<
  any,
  import('@apollo/client').OperationVariables,
  import('@apollo/client').DefaultContext,
  import('@apollo/client').ApolloCache<any>
>;
/**
 * Type-safe wrapper for the install mutation variables
 */
export type InstallServiceVariables = {
  input: InstallServiceInput;
};
//# sourceMappingURL=useInstallService.d.ts.map
