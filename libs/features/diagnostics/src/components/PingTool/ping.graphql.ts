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

import { gql } from '@apollo/client';

/**
 * Mutation to start a ping test
 *
 * Returns jobId for tracking the test via subscription
 */
export const RUN_PING = gql`
  mutation RunPing($input: RunPingInput!) {
    runPing(input: $input) {
      jobId
      status
    }
  }
`;

/**
 * Mutation to stop a running ping test
 */
export const STOP_PING = gql`
  mutation StopPing($jobId: ID!) {
    stopPing(jobId: $jobId) {
      jobId
      status
    }
  }
`;

/**
 * Subscription to receive ping results in real-time
 *
 * Emits each PingResult as it arrives from the router
 */
export const PING_RESULTS = gql`
  subscription PingResults($jobId: ID!) {
    pingResults(jobId: $jobId) {
      seq
      bytes
      ttl
      time
      target
      source
      error
      timestamp
    }
  }
`;

/**
 * Query to get current status of a ping job
 *
 * Useful for recovering state after reconnection
 */
export const PING_JOB_STATUS = gql`
  query PingJobStatus($jobId: ID!) {
    pingJob(jobId: $jobId) {
      id
      status
      results {
        seq
        bytes
        ttl
        time
        target
        source
        error
        timestamp
      }
      statistics {
        sent
        received
        lost
        lossPercent
        minRtt
        avgRtt
        maxRtt
        stdDev
      }
    }
  }
`;
