/**
 * GraphQL Operations for Ping Diagnostic Tool
 *
 * Mutations:
 * - RUN_PING: Start a new ping test
 * - STOP_PING: Stop a running ping test
 *
 * Subscriptions:
 * - PING_RESULTS: Stream ping results in real-time
 *
 * Queries:
 * - PING_JOB_STATUS: Get current status of a ping job
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
