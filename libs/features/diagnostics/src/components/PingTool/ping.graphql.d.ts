/**
 * GraphQL Operations for Ping Diagnostic Tool
 *
 * Provides mutations, subscriptions, and queries for managing ping diagnostic tests.
 *
 * @module PingTool GraphQL
 *
 * Operations:
 * - `RUN_PING`: Mutation to start a new ping test
 * - `STOP_PING`: Mutation to stop a running ping test
 * - `PING_RESULTS`: Subscription for real-time ping result streaming
 * - `PING_JOB_STATUS`: Query to get current status of a ping job
 *
 * @example
 * ```tsx
 * import { RUN_PING, PING_RESULTS } from './ping.graphql';
 * import { useMutation, useSubscription } from '@apollo/client';
 *
 * const [runPing] = useMutation(RUN_PING);
 * const { data } = useSubscription(PING_RESULTS, { variables: { jobId } });
 * ```
 */
/**
 * Mutation to start a ping test
 *
 * Returns jobId for tracking the test via subscription
 */
export declare const RUN_PING: import("graphql").DocumentNode;
/**
 * Mutation to stop a running ping test
 */
export declare const STOP_PING: import("graphql").DocumentNode;
/**
 * Subscription to receive ping results in real-time
 *
 * Emits each PingResult as it arrives from the router
 */
export declare const PING_RESULTS: import("graphql").DocumentNode;
/**
 * Query to get current status of a ping job
 *
 * Useful for recovering state after reconnection
 */
export declare const PING_JOB_STATUS: import("graphql").DocumentNode;
//# sourceMappingURL=ping.graphql.d.ts.map