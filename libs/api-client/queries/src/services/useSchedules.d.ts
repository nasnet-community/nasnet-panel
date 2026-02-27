/**
 * Routing Schedule Query Hooks
 * NAS-8.X: Implement Time-Based Service Scheduling
 *
 * Provides TanStack Query hooks for managing time-based routing schedules.
 * Enables features like parental controls, time-based VPN routing, etc.
 *
 * @see Docs/sprint-artifacts/Epic8-Network-Routing/NAS-8-X-time-based-service-scheduling.md
 */
import { UseQueryResult } from '@tanstack/react-query';
import type {
  RoutingSchedule,
  CreateScheduleInput,
  UpdateScheduleInput,
} from '@nasnet/api-client/generated';
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
/**
 * Query keys for schedule operations
 * Follows TanStack Query best practices for hierarchical keys
 */
export declare const scheduleKeys: {
  all: readonly ['schedules'];
  byRouter: (routerId: string) => readonly ['schedules', string];
  byRouting: (
    routerId: string,
    routingId: string
  ) => readonly ['schedules', string, 'routing', string];
  byId: (
    routerId: string,
    scheduleId: string
  ) => readonly ['schedules', string, 'schedule', string];
};
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
export declare function useRoutingSchedules(
  routerID: string,
  routingID: string,
  options?: UseRoutingSchedulesOptions
): UseQueryResult<RoutingSchedule[], Error>;
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
export declare function useRoutingSchedule(
  routerID: string,
  scheduleID: string,
  options?: UseRoutingScheduleOptions
): UseQueryResult<RoutingSchedule | null, Error>;
/**
 * Hook to create a new routing schedule
 *
 * NO optimistic update - server needs to generate ID and compute isActive
 * Automatically invalidates schedule queries after success
 *
 * @returns Mutation function and state
 */
export declare function useCreateSchedule(): import('@tanstack/react-query').UseMutationResult<
  RoutingSchedule,
  Error,
  CreateScheduleVariables,
  unknown
>;
/**
 * Hook to update an existing routing schedule
 *
 * Uses optimistic updates for instant UI feedback
 * Automatically invalidates schedule queries
 *
 * @returns Mutation function and state
 */
export declare function useUpdateSchedule(): import('@tanstack/react-query').UseMutationResult<
  RoutingSchedule,
  Error,
  UpdateScheduleVariables,
  {
    previousSchedules: [readonly unknown[], RoutingSchedule[] | undefined][];
    previousSchedule: RoutingSchedule | undefined;
  }
>;
/**
 * Hook to delete a routing schedule
 *
 * Uses optimistic removal for instant UI feedback
 * Automatically invalidates schedule and device routing queries
 *
 * @returns Mutation function and state
 */
export declare function useDeleteSchedule(): import('@tanstack/react-query').UseMutationResult<
  boolean,
  Error,
  DeleteScheduleVariables,
  {
    previousSchedules: [readonly unknown[], RoutingSchedule[] | undefined][];
  }
>;
export {};
//# sourceMappingURL=useSchedules.d.ts.map
