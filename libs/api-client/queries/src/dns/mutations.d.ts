/**
 * DNS Mutation Hooks
 * Updates DNS settings and manages static entries using Apollo Client + GraphQL
 *
 * Per ADR-011: Unified GraphQL Architecture
 * Story: NAS-6.4 - Implement DNS Configuration
 */
/**
 * Hook to update DNS settings
 *
 * Automatically refetches DNS settings after successful update
 * to ensure UI reflects latest state.
 *
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const [updateSettings, { loading }] = useUpdateDNSSettings();
 *
 * const handleSubmit = async (values) => {
 *   await updateSettings({
 *     variables: {
 *       deviceId: routerId,
 *       input: {
 *         servers: values.servers,
 *         allowRemoteRequests: values.allowRemoteRequests,
 *         cacheSize: values.cacheSize,
 *       },
 *     },
 *   });
 * };
 * ```
 */
export declare function useUpdateDNSSettings(): import("@apollo/client").MutationTuple<any, import("@apollo/client").OperationVariables, import("@apollo/client").DefaultContext, import("@apollo/client").ApolloCache<any>>;
/**
 * Hook to create a new DNS static entry
 *
 * Automatically refetches static entries list after successful creation
 * to show the new entry in the UI.
 *
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const [createEntry, { loading }] = useCreateDNSStaticEntry();
 *
 * const handleAdd = async (values) => {
 *   await createEntry({
 *     variables: {
 *       deviceId: routerId,
 *       input: {
 *         name: 'nas.local',
 *         address: '192.168.1.50',
 *         ttl: 86400,
 *         comment: 'Network storage',
 *       },
 *     },
 *   });
 * };
 * ```
 */
export declare function useCreateDNSStaticEntry(): import("@apollo/client").MutationTuple<any, import("@apollo/client").OperationVariables, import("@apollo/client").DefaultContext, import("@apollo/client").ApolloCache<any>>;
/**
 * Hook to update an existing DNS static entry
 *
 * Automatically refetches static entries list after successful update
 * to reflect changes in the UI.
 *
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const [updateEntry, { loading }] = useUpdateDNSStaticEntry();
 *
 * const handleEdit = async (entryId, values) => {
 *   await updateEntry({
 *     variables: {
 *       deviceId: routerId,
 *       entryId,
 *       input: {
 *         name: values.name,
 *         address: values.address,
 *         ttl: values.ttl,
 *         comment: values.comment,
 *       },
 *     },
 *   });
 * };
 * ```
 */
export declare function useUpdateDNSStaticEntry(): import("@apollo/client").MutationTuple<any, import("@apollo/client").OperationVariables, import("@apollo/client").DefaultContext, import("@apollo/client").ApolloCache<any>>;
/**
 * Hook to delete a DNS static entry
 *
 * Automatically refetches static entries list after successful deletion
 * to remove the entry from the UI.
 *
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const [deleteEntry, { loading }] = useDeleteDNSStaticEntry();
 *
 * const handleDelete = async (entryId) => {
 *   await deleteEntry({
 *     variables: {
 *       deviceId: routerId,
 *       entryId,
 *     },
 *   });
 * };
 * ```
 */
export declare function useDeleteDNSStaticEntry(): import("@apollo/client").MutationTuple<any, import("@apollo/client").OperationVariables, import("@apollo/client").DefaultContext, import("@apollo/client").ApolloCache<any>>;
//# sourceMappingURL=mutations.d.ts.map