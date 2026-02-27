/**
 * Routing Schedule Query Hooks
 * NAS-8.X: Implement Time-Based Service Scheduling
 *
 * Provides TanStack Query hooks for managing time-based routing schedules.
 * Enables features like parental controls, time-based VPN routing, etc.
 *
 * @see Docs/sprint-artifacts/Epic8-Network-Routing/NAS-8-X-time-based-service-scheduling.md
 */

import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { gql } from '@apollo/client';
import { apolloClient } from '@nasnet/api-client/core';
import type {
  RoutingSchedule,
  CreateScheduleInput,
  UpdateScheduleInput,
} from '@nasnet/api-client/generated';

// =============================================================================
// Types
// =============================================================================

/**
 * Input for creating a routing schedule
 */
export interface CreateScheduleVariables {
  routerID: string;
  input: CreateScheduleInput;
}

/**
 * Input for updating a routing schedule
 */
export interface UpdateScheduleVariables {
  routerID: string;
  scheduleID: string;
  input: UpdateScheduleInput;
}

/**
 * Input for deleting a routing schedule
 */
export interface DeleteScheduleVariables {
  routerID: string;
  scheduleID: string;
}

/**
 * Input for fetching schedules by routing ID
 */
export interface RoutingSchedulesVariables {
  routerID: string;
  routingID: string;
}

/**
 * Input for fetching a single schedule by ID
 */
export interface RoutingScheduleVariables {
  routerID: string;
  scheduleID: string;
}

// =============================================================================
// GraphQL Documents
// =============================================================================

/**
 * Query to fetch all schedules for a device routing
 */
const GET_ROUTING_SCHEDULES = gql`
  query GetRoutingSchedules($routerID: ID!, $routingID: ID!) {
    routingSchedules(routerID: $routerID, routingID: $routingID) {
      id
      routingID
      days
      startTime
      endTime
      enabled
      isActive
      lastActivated
      lastDeactivated
      createdAt
      updatedAt
    }
  }
`;

/**
 * Query to fetch a single schedule by ID
 */
const GET_ROUTING_SCHEDULE = gql`
  query GetRoutingSchedule($routerID: ID!, $scheduleID: ID!) {
    routingSchedule(routerID: $routerID, scheduleID: $scheduleID) {
      id
      routingID
      days
      startTime
      endTime
      enabled
      isActive
      lastActivated
      lastDeactivated
      createdAt
      updatedAt
    }
  }
`;

/**
 * Mutation to create a new schedule
 */
const CREATE_SCHEDULE = gql`
  mutation CreateSchedule($routerID: ID!, $input: CreateScheduleInput!) {
    createSchedule(routerID: $routerID, input: $input) {
      id
      routingID
      days
      startTime
      endTime
      enabled
      isActive
      lastActivated
      lastDeactivated
      createdAt
      updatedAt
    }
  }
`;

/**
 * Mutation to update an existing schedule
 */
const UPDATE_SCHEDULE = gql`
  mutation UpdateSchedule($routerID: ID!, $scheduleID: ID!, $input: UpdateScheduleInput!) {
    updateSchedule(routerID: $routerID, scheduleID: $scheduleID, input: $input) {
      id
      routingID
      days
      startTime
      endTime
      enabled
      isActive
      lastActivated
      lastDeactivated
      createdAt
      updatedAt
    }
  }
`;

/**
 * Mutation to delete a schedule
 */
const DELETE_SCHEDULE = gql`
  mutation DeleteSchedule($routerID: ID!, $scheduleID: ID!) {
    deleteSchedule(routerID: $routerID, scheduleID: $scheduleID)
  }
`;

// =============================================================================
// Query Keys
// =============================================================================

/**
 * Query keys for schedule operations
 * Follows TanStack Query best practices for hierarchical keys
 */
export const scheduleKeys = {
  all: ['schedules'] as const,
  byRouter: (routerId: string) => ['schedules', routerId] as const,
  byRouting: (routerId: string, routingId: string) =>
    ['schedules', routerId, 'routing', routingId] as const,
  byId: (routerId: string, scheduleId: string) =>
    ['schedules', routerId, 'schedule', scheduleId] as const,
};

// =============================================================================
// API Functions
// =============================================================================

/**
 * Fetch all schedules for a device routing
 */
async function fetchRoutingSchedules(
  routerID: string,
  routingID: string
): Promise<RoutingSchedule[]> {
  const { data } = await apolloClient.query({
    query: GET_ROUTING_SCHEDULES,
    variables: { routerID, routingID },
    fetchPolicy: 'network-only',
  });

  return data.routingSchedules as RoutingSchedule[];
}

/**
 * Fetch a single schedule by ID
 */
async function fetchRoutingSchedule(
  routerID: string,
  scheduleID: string
): Promise<RoutingSchedule | null> {
  const { data } = await apolloClient.query({
    query: GET_ROUTING_SCHEDULE,
    variables: { routerID, scheduleID },
    fetchPolicy: 'network-only',
  });

  return (data.routingSchedule as RoutingSchedule) || null;
}

/**
 * Create a new routing schedule
 */
async function createSchedule(variables: CreateScheduleVariables): Promise<RoutingSchedule> {
  const { data } = await apolloClient.mutate({
    mutation: CREATE_SCHEDULE,
    variables,
  });

  if (!data?.createSchedule) {
    throw new Error('Failed to create schedule');
  }

  return data.createSchedule as RoutingSchedule;
}

/**
 * Update an existing routing schedule
 */
async function updateSchedule(variables: UpdateScheduleVariables): Promise<RoutingSchedule> {
  const { data } = await apolloClient.mutate({
    mutation: UPDATE_SCHEDULE,
    variables,
  });

  if (!data?.updateSchedule) {
    throw new Error('Failed to update schedule');
  }

  return data.updateSchedule as RoutingSchedule;
}

/**
 * Delete a routing schedule
 */
async function deleteSchedule(variables: DeleteScheduleVariables): Promise<boolean> {
  const { data } = await apolloClient.mutate({
    mutation: DELETE_SCHEDULE,
    variables,
  });

  return (data?.deleteSchedule as boolean) ?? false;
}

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Hook to fetch all schedules for a device routing
 *
 * Fetches schedules ordered by start time
 * Stale time: 30 seconds
 *
 * @param routerID - Target router ID
 * @param routingID - Device routing ID
 * @param options - Query options
 * @returns Query result with RoutingSchedule[] data
 */
interface UseRoutingSchedulesOptions {
  enabled?: boolean;
}

export function useRoutingSchedules(
  routerID: string,
  routingID: string,
  options?: UseRoutingSchedulesOptions
): UseQueryResult<RoutingSchedule[], Error> {
  return useQuery({
    queryKey: scheduleKeys.byRouting(routerID, routingID),
    queryFn: () => fetchRoutingSchedules(routerID, routingID),
    enabled: !!routerID && !!routingID && (options?.enabled ?? true),
    staleTime: 30_000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to fetch a single schedule by ID
 *
 * Fetches a specific schedule with current active status
 * Stale time: 30 seconds
 *
 * @param routerID - Target router ID
 * @param scheduleID - Schedule ID
 * @param options - Query options
 * @returns Query result with RoutingSchedule data
 */
interface UseRoutingScheduleOptions {
  enabled?: boolean;
}

export function useRoutingSchedule(
  routerID: string,
  scheduleID: string,
  options?: UseRoutingScheduleOptions
): UseQueryResult<RoutingSchedule | null, Error> {
  return useQuery({
    queryKey: scheduleKeys.byId(routerID, scheduleID),
    queryFn: () => fetchRoutingSchedule(routerID, scheduleID),
    enabled: !!routerID && !!scheduleID && (options?.enabled ?? true),
    staleTime: 30_000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Hook to create a new routing schedule
 *
 * NO optimistic update - server needs to generate ID and compute isActive
 * Automatically invalidates schedule queries after success
 *
 * @returns Mutation function and state
 */
export function useCreateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSchedule,
    onSuccess: (data) => {
      // Invalidate schedules for this routing
      queryClient.invalidateQueries({
        queryKey: scheduleKeys.byRouting(data.routingID, data.routingID),
      });
      // Invalidate device routing to update hasSchedules field
      queryClient.invalidateQueries({
        queryKey: ['deviceRouting'],
      });
    },
  });
}

/**
 * Hook to update an existing routing schedule
 *
 * Uses optimistic updates for instant UI feedback
 * Automatically invalidates schedule queries
 *
 * @returns Mutation function and state
 */
export function useUpdateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSchedule,
    onMutate: async (variables) => {
      const { routerID, scheduleID, input } = variables;

      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: scheduleKeys.byRouter(routerID),
      });

      // Snapshot previous values
      const previousSchedules = queryClient.getQueriesData<RoutingSchedule[]>({
        queryKey: scheduleKeys.byRouter(routerID),
      });

      // Optimistically update all schedule queries that contain this schedule
      previousSchedules.forEach(([queryKey, schedules]) => {
        if (schedules) {
          queryClient.setQueryData(
            queryKey,
            schedules.map((schedule) =>
              schedule.id === scheduleID ?
                ({ ...schedule, ...input, updatedAt: new Date().toISOString() } as any)
              : schedule
            )
          );
        }
      });

      // Optimistically update single schedule query
      const previousSchedule = queryClient.getQueryData<RoutingSchedule>(
        scheduleKeys.byId(routerID, scheduleID)
      );
      if (previousSchedule) {
        queryClient.setQueryData(scheduleKeys.byId(routerID, scheduleID), {
          ...previousSchedule,
          ...input,
          updatedAt: new Date().toISOString(),
        } as any);
      }

      return { previousSchedules, previousSchedule };
    },
    onError: (_error, variables, context) => {
      // Rollback on error
      if (context?.previousSchedules) {
        context.previousSchedules.forEach(([queryKey, schedules]) => {
          queryClient.setQueryData(queryKey, schedules);
        });
      }
      if (context?.previousSchedule) {
        queryClient.setQueryData(
          scheduleKeys.byId(variables.routerID, variables.scheduleID),
          context.previousSchedule
        );
      }
    },
    onSettled: (_data, _error, variables) => {
      // Refetch after mutation to get accurate server state (especially isActive)
      queryClient.invalidateQueries({
        queryKey: scheduleKeys.byRouter(variables.routerID),
      });
    },
  });
}

/**
 * Hook to delete a routing schedule
 *
 * Uses optimistic removal for instant UI feedback
 * Automatically invalidates schedule and device routing queries
 *
 * @returns Mutation function and state
 */
export function useDeleteSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSchedule,
    onMutate: async (variables) => {
      const { routerID, scheduleID } = variables;

      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: scheduleKeys.byRouter(routerID),
      });

      // Snapshot previous values
      const previousSchedules = queryClient.getQueriesData<RoutingSchedule[]>({
        queryKey: scheduleKeys.byRouter(routerID),
      });

      // Optimistically remove schedule from all queries
      previousSchedules.forEach(([queryKey, schedules]) => {
        if (schedules) {
          queryClient.setQueryData<RoutingSchedule[]>(
            queryKey,
            schedules.filter((schedule) => schedule.id !== scheduleID)
          );
        }
      });

      // Remove single schedule query
      queryClient.removeQueries({
        queryKey: scheduleKeys.byId(routerID, scheduleID),
      });

      return { previousSchedules };
    },
    onError: (_error, variables, context) => {
      // Rollback on error
      if (context?.previousSchedules) {
        context.previousSchedules.forEach(([queryKey, schedules]) => {
          queryClient.setQueryData(queryKey, schedules);
        });
      }
    },
    onSettled: (_data, _error, variables) => {
      // Refetch after mutation
      queryClient.invalidateQueries({
        queryKey: scheduleKeys.byRouter(variables.routerID),
      });
      // Invalidate device routing to update hasSchedules field
      queryClient.invalidateQueries({
        queryKey: ['deviceRouting'],
      });
    },
  });
}
