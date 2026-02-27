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
export declare function useDependencyMutations(): {
  /**
   * Add a new dependency relationship between service instances
   * Pre-validates that the relationship won't create a cycle
   */
  addDependency: (input: AddDependencyInput) => Promise<import('@apollo/client').FetchResult<any>>;
  /**
   * Remove an existing dependency relationship
   */
  removeDependency: (
    input: RemoveDependencyInput
  ) => Promise<import('@apollo/client').FetchResult<any>>;
  /**
   * Manually trigger the boot sequence for auto-start instances
   * Useful for testing or re-running boot sequence after failures
   */
  triggerBootSequence: () => Promise<import('@apollo/client').FetchResult<any>>;
  /**
   * Loading states for each mutation
   */
  loading: {
    add: boolean;
    remove: boolean;
    trigger: boolean;
  };
  /**
   * Error states for each mutation
   */
  errors: {
    add: import('@apollo/client').ApolloError | undefined;
    remove: import('@apollo/client').ApolloError | undefined;
    trigger: import('@apollo/client').ApolloError | undefined;
  };
};
//# sourceMappingURL=useDependencyMutations.d.ts.map
