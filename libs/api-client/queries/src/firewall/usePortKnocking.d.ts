/**
 * Port Knocking Query and Mutation Hooks
 * Manages port knock sequences via GraphQL
 *
 * Port knocking hides sensitive services behind secret knock sequences:
 * - Client hits N ports in correct order within knockTimeout
 * - Each stage adds IP to stage-specific address list
 * - Final stage grants access with accessTimeout
 * - Prevents port scanning and unauthorized access
 *
 * @see Docs/sprint-artifacts/Epic7-Security-Firewall/NAS-7-12-implement-port-knocking.md
 */
import type {
  PortKnockSequence,
  PortKnockSequenceInput,
  PortKnockAttempt,
} from '@nasnet/core/types';
/**
 * Query keys for port knock queries
 * Follows TanStack Query best practices for hierarchical keys
 */
export declare const portKnockKeys: {
  all: (routerId: string) => readonly ['portKnocking', string];
  sequences: (routerId: string) => readonly ['portKnocking', string, 'sequences'];
  sequence: (routerId: string, id: string) => readonly ['portKnocking', string, 'sequence', string];
  log: (
    routerId: string,
    filters?: Record<string, unknown>
  ) => readonly ['portKnocking', string, 'log', Record<string, unknown> | undefined];
};
/**
 * Get all port knock sequences for a router
 */
export declare function usePortKnockSequences(
  routerId: string
): import('@apollo/client').InteropQueryResult<
  {
    portKnockSequences: PortKnockSequence[];
  },
  import('@apollo/client').OperationVariables
>;
/**
 * Get single port knock sequence by ID
 */
export declare function usePortKnockSequence(
  routerId: string,
  id: string
): import('@apollo/client').InteropQueryResult<
  {
    portKnockSequence: PortKnockSequence | null;
  },
  import('@apollo/client').OperationVariables
>;
/**
 * Get port knock attempt log with infinite scroll
 */
export declare function usePortKnockLog(
  routerId: string,
  filters?: {
    status?: string;
    sourceIP?: string;
    sequenceId?: string;
    startDate?: string;
    endDate?: string;
  }
): import('@tanstack/react-query').UseInfiniteQueryResult<
  import('@tanstack/query-core').InfiniteData<
    {
      attempts: PortKnockAttempt[];
      pageInfo: {
        hasNextPage: boolean;
        endCursor: null;
      };
      totalCount: number;
    },
    unknown
  >,
  Error
>;
/**
 * Create a new port knock sequence
 */
export declare function useCreatePortKnockSequence(): import('@apollo/client').MutationTuple<
  {
    createPortKnockSequence: PortKnockSequence;
  },
  {
    routerId: string;
    input: PortKnockSequenceInput;
  },
  import('@apollo/client').DefaultContext,
  import('@apollo/client').ApolloCache<any>
>;
/**
 * Update existing port knock sequence
 */
export declare function useUpdatePortKnockSequence(): import('@apollo/client').MutationTuple<
  {
    updatePortKnockSequence: PortKnockSequence;
  },
  {
    routerId: string;
    id: string;
    input: PortKnockSequenceInput;
  },
  import('@apollo/client').DefaultContext,
  import('@apollo/client').ApolloCache<any>
>;
/**
 * Delete port knock sequence
 */
export declare function useDeletePortKnockSequence(): import('@apollo/client').MutationTuple<
  {
    deletePortKnockSequence: boolean;
  },
  {
    routerId: string;
    id: string;
  },
  import('@apollo/client').DefaultContext,
  import('@apollo/client').ApolloCache<any>
>;
/**
 * Toggle port knock sequence enabled/disabled
 */
export declare function useTogglePortKnockSequence(): import('@apollo/client').MutationTuple<
  {
    togglePortKnockSequence: PortKnockSequence;
  },
  {
    routerId: string;
    id: string;
    enabled: boolean;
  },
  import('@apollo/client').DefaultContext,
  import('@apollo/client').ApolloCache<any>
>;
/**
 * Test port knock sequence (creates temporary rules)
 */
export declare function useTestPortKnockSequence(): import('@apollo/client').MutationTuple<
  {
    testPortKnockSequence: {
      success: boolean;
      testInstructions: string;
      message: string;
      testRuleIds: string[];
    };
  },
  {
    routerId: string;
    id: string;
  },
  import('@apollo/client').DefaultContext,
  import('@apollo/client').ApolloCache<any>
>;
//# sourceMappingURL=usePortKnocking.d.ts.map
