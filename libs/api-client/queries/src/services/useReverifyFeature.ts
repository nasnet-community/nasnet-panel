/**
 * useReverifyFeature Hook
 *
 * Apollo Client hook for triggering binary reverification.
 * Part of the binary verification security feature.
 *
 * @module @nasnet/api-client/queries/services
 */

import { gql, useMutation, type MutationHookOptions } from '@apollo/client';
import type { ReverifyPayload } from '@nasnet/api-client/generated';
import {
  GET_FEATURE_VERIFICATION,
  GET_INSTANCE_VERIFICATION_STATUS,
  GET_SERVICE_INSTANCE,
  GET_SERVICE_INSTANCES,
} from './services.graphql';

/**
 * GraphQL mutation for reverifying a service instance binary
 */
export const REVERIFY_INSTANCE = gql`
  mutation ReverifyInstance($routerID: ID!, $instanceID: ID!) {
    reverifyInstance(routerID: $routerID, instanceID: $instanceID) {
      instanceID
      success
      currentHash
      expectedHash
      errorMessage
      errors {
        message
        path
      }
    }
  }
`;

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
export function useReverifyFeature(
  options?: MutationHookOptions<ReverifyInstanceResult, ReverifyInstanceVariables>
) {
  return useMutation<ReverifyInstanceResult, ReverifyInstanceVariables>(
    REVERIFY_INSTANCE,
    {
      // Refetch queries after successful reverification
      refetchQueries: [
        GET_FEATURE_VERIFICATION,
        GET_INSTANCE_VERIFICATION_STATUS,
        GET_SERVICE_INSTANCE,
        GET_SERVICE_INSTANCES,
      ],

      // Optional: Optimistic response for immediate UI feedback
      // This updates the cache before the server responds
      optimisticResponse: (variables) => ({
        reverifyInstance: {
          instanceID: variables.instanceID,
          success: true,
          currentHash: null,
          expectedHash: null,
          errorMessage: null,
          errors: null,
          __typename: 'ReverifyPayload',
        },
      }),

      // Update cache after mutation completes
      update: (cache, { data }) => {
        if (data?.reverifyInstance.success) {
          // Evict cache for this instance to force refetch
          cache.evict({
            id: `ServiceInstance:${data.reverifyInstance.instanceID}`,
            fieldName: 'verification',
          });

          // Trigger garbage collection
          cache.gc();
        }
      },

      ...options,
    }
  );
}
