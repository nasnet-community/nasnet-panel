/**
 * useReverifyFeature Hook
 *
 * Apollo Client hook for triggering binary reverification.
 * Part of the binary verification security feature.
 *
 * @module @nasnet/api-client/queries/services
 */
import { type MutationHookOptions } from '@apollo/client';
import type { ReverifyPayload } from '@nasnet/api-client/generated';
/**
 * GraphQL mutation for reverifying a service instance binary
 */
export declare const REVERIFY_INSTANCE: import("graphql").DocumentNode;
/**
 * Variables for REVERIFY_INSTANCE mutation
 */
export interface ReverifyInstanceVariables {
    routerID: string;
    instanceID: string;
}
/**
 * Result type for REVERIFY_INSTANCE mutation
 */
export interface ReverifyInstanceResult {
    reverifyInstance: ReverifyPayload;
}
/**
 * Hook for triggering binary reverification of a service instance.
 *
 * Automatically refetches verification data and invalidates cache after success.
 * Provides optimistic response for immediate UI feedback.
 *
 * @param options - Apollo mutation options
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * function ReverifyButton({ routerID, instanceID }) {
 *   const [reverify, { loading, error, data }] = useReverifyFeature();
 *
 *   const handleReverify = async () => {
 *     const result = await reverify({
 *       variables: { routerID, instanceID },
 *     });
 *
 *     if (result.data?.reverifyInstance.success) {
 *       toast.success('Reverification successful!');
 *     } else {
 *       toast.error(result.data?.reverifyInstance.errorMessage);
 *     }
 *   };
 *
 *   return (
 *     <Button onClick={handleReverify} disabled={loading}>
 *       {loading ? 'Verifying...' : 'Re-verify'}
 *     </Button>
 *   );
 * }
 * ```
 */
export declare function useReverifyFeature(options?: MutationHookOptions<ReverifyInstanceResult, ReverifyInstanceVariables>): import("@apollo/client").MutationTuple<ReverifyInstanceResult, ReverifyInstanceVariables, import("@apollo/client").DefaultContext, import("@apollo/client").ApolloCache<any>>;
//# sourceMappingURL=useReverifyFeature.d.ts.map