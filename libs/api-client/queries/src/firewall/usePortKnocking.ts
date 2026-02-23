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

import { useQuery, useMutation, useInfiniteQuery } from '@tanstack/react-query';
import { gql, useMutation as useApolloMutation, useQuery as useApolloQuery } from '@apollo/client';
import type {
  PortKnockSequence,
  PortKnockSequenceInput,
  PortKnockAttempt,
} from '@nasnet/core/types';

// ============================================================================
// Query Keys
// ============================================================================

/**
 * Query keys for port knock queries
 * Follows TanStack Query best practices for hierarchical keys
 */
export const portKnockKeys = {
  all: (routerId: string) => ['portKnocking', routerId] as const,
  sequences: (routerId: string) => [...portKnockKeys.all(routerId), 'sequences'] as const,
  sequence: (routerId: string, id: string) => [...portKnockKeys.all(routerId), 'sequence', id] as const,
  log: (routerId: string, filters?: Record<string, unknown>) =>
    [...portKnockKeys.all(routerId), 'log', filters] as const,
};

// ============================================================================
// GraphQL Queries
// ============================================================================

const GET_PORT_KNOCK_SEQUENCES = gql`
  query GetPortKnockSequences($routerId: ID!) {
    portKnockSequences(routerId: $routerId) {
      id
      name
      knockPorts {
        port
        protocol
        order
      }
      protectedPort
      protectedProtocol
      accessTimeout
      knockTimeout
      enabled
      routerId
      createdAt
      updatedAt
      recentAccessCount
      generatedRuleIds
    }
  }
`;

const GET_PORT_KNOCK_SEQUENCE = gql`
  query GetPortKnockSequence($routerId: ID!, $id: ID!) {
    portKnockSequence(routerId: $routerId, id: $id) {
      id
      name
      knockPorts {
        port
        protocol
        order
      }
      protectedPort
      protectedProtocol
      accessTimeout
      knockTimeout
      enabled
      routerId
      createdAt
      updatedAt
      recentAccessCount
      generatedRuleIds
    }
  }
`;

const GET_PORT_KNOCK_LOG = gql`
  query GetPortKnockLog(
    $routerId: ID!
    $filters: PortKnockLogFilters
    $first: Int
    $after: String
  ) {
    portKnockLog(
      routerId: $routerId
      filters: $filters
      first: $first
      after: $after
    ) {
      edges {
        cursor
        node {
          id
          sequenceId
          sequenceName
          sourceIP
          timestamp
          status
          portsHit
          protectedPort
          progress
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`;

// ============================================================================
// GraphQL Mutations
// ============================================================================

const CREATE_PORT_KNOCK_SEQUENCE = gql`
  mutation CreatePortKnockSequence($routerId: ID!, $input: PortKnockSequenceInput!) {
    createPortKnockSequence(routerId: $routerId, input: $input) {
      id
      name
      knockPorts {
        port
        protocol
        order
      }
      protectedPort
      protectedProtocol
      accessTimeout
      knockTimeout
      enabled
      routerId
      createdAt
      updatedAt
      recentAccessCount
      generatedRuleIds
    }
  }
`;

const UPDATE_PORT_KNOCK_SEQUENCE = gql`
  mutation UpdatePortKnockSequence($routerId: ID!, $id: ID!, $input: PortKnockSequenceInput!) {
    updatePortKnockSequence(routerId: $routerId, id: $id, input: $input) {
      id
      name
      knockPorts {
        port
        protocol
        order
      }
      protectedPort
      protectedProtocol
      accessTimeout
      knockTimeout
      enabled
      routerId
      createdAt
      updatedAt
      recentAccessCount
      generatedRuleIds
    }
  }
`;

const DELETE_PORT_KNOCK_SEQUENCE = gql`
  mutation DeletePortKnockSequence($routerId: ID!, $id: ID!) {
    deletePortKnockSequence(routerId: $routerId, id: $id)
  }
`;

const TOGGLE_PORT_KNOCK_SEQUENCE = gql`
  mutation TogglePortKnockSequence($routerId: ID!, $id: ID!, $enabled: Boolean!) {
    togglePortKnockSequence(routerId: $routerId, id: $id, enabled: $enabled) {
      id
      enabled
      updatedAt
    }
  }
`;

const TEST_PORT_KNOCK_SEQUENCE = gql`
  mutation TestPortKnockSequence($routerId: ID!, $id: ID!) {
    testPortKnockSequence(routerId: $routerId, id: $id) {
      success
      testInstructions
      message
      testRuleIds
    }
  }
`;

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Get all port knock sequences for a router
 */
export function usePortKnockSequences(routerId: string) {
  return useApolloQuery<{ portKnockSequences: PortKnockSequence[] }>(
    GET_PORT_KNOCK_SEQUENCES,
    {
      variables: { routerId },
      skip: !routerId,
      fetchPolicy: 'cache-and-network',
      nextFetchPolicy: 'cache-first',
    }
  );
}

/**
 * Get single port knock sequence by ID
 */
export function usePortKnockSequence(routerId: string, id: string) {
  return useApolloQuery<{ portKnockSequence: PortKnockSequence | null }>(
    GET_PORT_KNOCK_SEQUENCE,
    {
      variables: { routerId, id },
      skip: !routerId || !id,
      fetchPolicy: 'cache-and-network',
    }
  );
}

/**
 * Get port knock attempt log with infinite scroll
 */
export function usePortKnockLog(
  routerId: string,
  filters?: {
    status?: string;
    sourceIP?: string;
    sequenceId?: string;
    startDate?: string;
    endDate?: string;
  }
) {
  return useInfiniteQuery({
    queryKey: portKnockKeys.log(routerId, filters),
    queryFn: async ({ pageParam }) => {
      // This would be implemented with Apollo Client in a real scenario
      // For now, returning a placeholder structure
      return {
        attempts: [] as PortKnockAttempt[],
        pageInfo: {
          hasNextPage: false,
          endCursor: null,
        },
        totalCount: 0,
      };
    },
    enabled: !!routerId,
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.pageInfo.hasNextPage ? lastPage.pageInfo.endCursor : undefined,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new port knock sequence
 */
export function useCreatePortKnockSequence() {
  return useApolloMutation<
    { createPortKnockSequence: PortKnockSequence },
    { routerId: string; input: PortKnockSequenceInput }
  >(CREATE_PORT_KNOCK_SEQUENCE, {
    refetchQueries: ['GetPortKnockSequences'],
    awaitRefetchQueries: true,
  });
}

/**
 * Update existing port knock sequence
 */
export function useUpdatePortKnockSequence() {
  return useApolloMutation<
    { updatePortKnockSequence: PortKnockSequence },
    { routerId: string; id: string; input: PortKnockSequenceInput }
  >(UPDATE_PORT_KNOCK_SEQUENCE, {
    refetchQueries: ['GetPortKnockSequences', 'GetPortKnockSequence'],
    awaitRefetchQueries: true,
  });
}

/**
 * Delete port knock sequence
 */
export function useDeletePortKnockSequence() {
  return useApolloMutation<
    { deletePortKnockSequence: boolean },
    { routerId: string; id: string }
  >(DELETE_PORT_KNOCK_SEQUENCE, {
    refetchQueries: ['GetPortKnockSequences'],
    awaitRefetchQueries: true,
  });
}

/**
 * Toggle port knock sequence enabled/disabled
 */
export function useTogglePortKnockSequence() {
  return useApolloMutation<
    { togglePortKnockSequence: PortKnockSequence },
    { routerId: string; id: string; enabled: boolean }
  >(TOGGLE_PORT_KNOCK_SEQUENCE, {
    refetchQueries: ['GetPortKnockSequences'],
  });
}

/**
 * Test port knock sequence (creates temporary rules)
 */
export function useTestPortKnockSequence() {
  return useApolloMutation<
    {
      testPortKnockSequence: {
        success: boolean;
        testInstructions: string;
        message: string;
        testRuleIds: string[];
      };
    },
    { routerId: string; id: string }
  >(TEST_PORT_KNOCK_SEQUENCE);
}
