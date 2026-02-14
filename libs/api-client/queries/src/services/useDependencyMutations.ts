import { useMutation, useApolloClient } from '@apollo/client';
import {
  ADD_DEPENDENCY,
  REMOVE_DEPENDENCY,
  TRIGGER_BOOT_SEQUENCE,
  GET_DEPENDENCIES,
  GET_DEPENDENTS,
  GET_DEPENDENCY_GRAPH,
} from './services.graphql';
import type { DependencyType } from './useDependencies';

/**
 * Input for adding a dependency relationship
 */
export interface AddDependencyInput {
  fromInstanceId: string;
  toInstanceId: string;
  dependencyType: DependencyType;
  autoStart: boolean;
  healthTimeoutSeconds: number;
}

/**
 * Input for removing a dependency relationship
 */
export interface RemoveDependencyInput {
  dependencyId: string;
}

/**
 * Hook providing all dependency management mutations
 *
 * Provides methods to add/remove dependencies and trigger the boot sequence.
 * Automatically refetches affected queries after mutations to keep UI in sync.
 *
 * @returns Mutation functions, loading states, and error states
 *
 * @example
 * ```tsx
 * const { addDependency, removeDependency, triggerBootSequence, loading, errors } =
 *   useDependencyMutations();
 *
 * // Add a dependency: Xray depends on Tor
 * await addDependency({
 *   fromInstanceId: 'xray-instance-123',
 *   toInstanceId: 'tor-instance-456',
 *   dependencyType: 'REQUIRES',
 *   autoStart: true,
 *   healthTimeoutSeconds: 30,
 * });
 *
 * // Remove a dependency
 * await removeDependency({
 *   dependencyId: 'dependency-789',
 * });
 *
 * // Trigger boot sequence
 * await triggerBootSequence();
 * ```
 */
export function useDependencyMutations() {
  const client = useApolloClient();

  const [addDependencyMutation, addMutationState] = useMutation(ADD_DEPENDENCY, {
    refetchQueries: [
      GET_DEPENDENCIES,
      GET_DEPENDENTS,
      GET_DEPENDENCY_GRAPH,
    ],
  });

  const [removeDependencyMutation, removeMutationState] = useMutation(
    REMOVE_DEPENDENCY,
    {
      onCompleted: (data) => {
        if (data?.removeDependency) {
          // Dependency removed successfully, invalidate cache
          client.refetchQueries({
            include: [GET_DEPENDENCIES, GET_DEPENDENTS, GET_DEPENDENCY_GRAPH],
          });
        }
      },
    }
  );

  const [triggerBootSequenceMutation, triggerMutationState] = useMutation(
    TRIGGER_BOOT_SEQUENCE
  );

  return {
    /**
     * Add a new dependency relationship between service instances
     * Pre-validates that the relationship won't create a cycle
     */
    addDependency: (input: AddDependencyInput) =>
      addDependencyMutation({ variables: { input } }),

    /**
     * Remove an existing dependency relationship
     */
    removeDependency: (input: RemoveDependencyInput) =>
      removeDependencyMutation({ variables: { input } }),

    /**
     * Manually trigger the boot sequence for auto-start instances
     * Useful for testing or re-running boot sequence after failures
     */
    triggerBootSequence: () => triggerBootSequenceMutation(),

    /**
     * Loading states for each mutation
     */
    loading: {
      add: addMutationState.loading,
      remove: removeMutationState.loading,
      trigger: triggerMutationState.loading,
    },

    /**
     * Error states for each mutation
     */
    errors: {
      add: addMutationState.error,
      remove: removeMutationState.error,
      trigger: triggerMutationState.error,
    },
  };
}
