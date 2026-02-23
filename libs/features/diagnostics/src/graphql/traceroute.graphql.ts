/**
 * Traceroute GraphQL Operations
 *
 * GraphQL fragments, mutations, and subscriptions for traceroute diagnostics.
 * Provides real-time progress tracking of network hop discovery via WebSocket.
 *
 * Operations:
 * - RUN_TRACEROUTE: Starts a traceroute job and returns job ID
 * - CANCEL_TRACEROUTE: Cancels a running traceroute job
 * - TRACEROUTE_PROGRESS_SUBSCRIPTION: Streams hop-by-hop progress events
 *
 * Fragments:
 * - HOP_PROBE_FRAGMENT: Single probe result (latency, success, ICMP code)
 * - TRACEROUTE_HOP_FRAGMENT: Single hop with all probes
 * - TRACEROUTE_RESULT_FRAGMENT: Complete traceroute result with all hops
 */

import { gql } from '@apollo/client';

/**
 * Fragment for individual probe data within a hop
 *
 * Fields:
 * - probeNumber: Sequential probe number within the hop
 * - latencyMs: Round-trip time in milliseconds (null if timeout)
 * - success: Whether probe received response
 * - icmpCode: ICMP code for unsuccessful probes (e.g., "Destination unreachable")
 */
export const HOP_PROBE_FRAGMENT = gql`
  fragment HopProbeFields on HopProbe {
    probeNumber
    latencyMs
    success
    icmpCode
  }
`;

/**
 * Fragment for a single traceroute hop
 *
 * Represents one network hop (intermediate router or destination).
 * Fields:
 * - hopNumber: Sequential hop number (1-based)
 * - address: IP address of the hop (null if no response)
 * - hostname: Reverse DNS hostname (if available)
 * - status: Hop status (RESPONSIVE, TIMEOUT, UNREACHABLE)
 * - avgLatencyMs: Average latency across all probes (null if all timeout)
 * - packetLoss: Percentage of probes that failed (0-100)
 * - probes: Array of individual probe results
 */
export const TRACEROUTE_HOP_FRAGMENT = gql`
  ${HOP_PROBE_FRAGMENT}
  fragment TracerouteHopFields on TracerouteHop {
    hopNumber
    address
    hostname
    status
    avgLatencyMs
    packetLoss
    probes {
      ...HopProbeFields
    }
  }
`;

/**
 * Fragment for complete traceroute result
 *
 * Represents final traceroute result with all hops discovered.
 * Fields:
 * - target: Original target hostname/IP provided by user
 * - targetIp: Resolved IP of the target
 * - protocol: Protocol used (ICMP, UDP, TCP)
 * - maxHops: Maximum hops configured for this run
 * - completed: Whether all hops were discovered
 * - reachedDestination: Whether traceroute reached the destination
 * - totalTimeMs: Total elapsed time for entire traceroute
 * - startedAt: Timestamp when traceroute started
 * - completedAt: Timestamp when traceroute completed
 * - hops: Array of all discovered hops
 */
export const TRACEROUTE_RESULT_FRAGMENT = gql`
  ${TRACEROUTE_HOP_FRAGMENT}
  fragment TracerouteResultFields on TracerouteResult {
    target
    targetIp
    protocol
    maxHops
    completed
    reachedDestination
    totalTimeMs
    startedAt
    completedAt
    hops {
      ...TracerouteHopFields
    }
  }
`;

/**
 * Mutation: Start a traceroute job
 *
 * Initiates a new traceroute from the specified device/router.
 * Returns job ID which is used for progress subscriptions.
 *
 * Variables:
 * - deviceId: Router/device ID to run traceroute from
 * - input: TracerouteInput with target, protocol, maxHops, timeout, probeCount
 *
 * Returns:
 * - jobId: Unique ID for tracking this traceroute job
 * - status: Initial job status
 *
 * @example
 * ```
 * mutation RunTraceroute($deviceId: ID!, $input: TracerouteInput!) {
 *   runTraceroute(deviceId: $deviceId, input: $input) {
 *     jobId
 *     status
 *   }
 * }
 * ```
 */
export const RUN_TRACEROUTE = gql`
  mutation RunTraceroute($deviceId: ID!, $input: TracerouteInput!) {
    runTraceroute(deviceId: $deviceId, input: $input) {
      jobId
      status
    }
  }
`;

/**
 * Mutation: Cancel a running traceroute job
 *
 * Stops a traceroute that is currently in progress.
 * Gracefully cancels without completing all hops.
 *
 * Variables:
 * - jobId: ID of the traceroute job to cancel (returned by RUN_TRACEROUTE)
 *
 * Returns:
 * - Boolean indicating whether cancellation was successful
 *
 * @example
 * ```
 * mutation CancelTraceroute($jobId: ID!) {
 *   cancelTraceroute(jobId: $jobId)
 * }
 * ```
 */
export const CANCEL_TRACEROUTE = gql`
  mutation CancelTraceroute($jobId: ID!) {
    cancelTraceroute(jobId: $jobId)
  }
`;

/**
 * Subscription: Traceroute progress events
 *
 * Streams real-time progress events during traceroute execution.
 * Client must first call RUN_TRACEROUTE to get jobId, then subscribe.
 *
 * Event types (via eventType field):
 * - HOP_DISCOVERED: New hop discovered; includes hop details
 * - COMPLETE: Traceroute finished; includes final result with all hops
 * - ERROR: Traceroute failed; includes error message
 * - CANCELLED: User cancelled the job
 *
 * Variables:
 * - jobId: ID returned from RUN_TRACEROUTE mutation
 *
 * Returns:
 * - jobId: Echo of the job ID
 * - eventType: Type of event (HOP_DISCOVERED | COMPLETE | ERROR | CANCELLED)
 * - hop: Hop details if eventType is HOP_DISCOVERED (null otherwise)
 * - result: Complete result if eventType is COMPLETE (null otherwise)
 * - error: Error message if eventType is ERROR (null otherwise)
 *
 * @example
 * ```
 * subscription TracerouteProgress($jobId: ID!) {
 *   tracerouteProgress(jobId: $jobId) {
 *     jobId
 *     eventType
 *     hop { ...TracerouteHopFields }
 *     result { ...TracerouteResultFields }
 *     error
 *   }
 * }
 * ```
 */
export const TRACEROUTE_PROGRESS_SUBSCRIPTION = gql`
  ${TRACEROUTE_HOP_FRAGMENT}
  ${TRACEROUTE_RESULT_FRAGMENT}
  subscription TracerouteProgress($jobId: ID!) {
    tracerouteProgress(jobId: $jobId) {
      jobId
      eventType
      hop {
        ...TracerouteHopFields
      }
      result {
        ...TracerouteResultFields
      }
      error
    }
  }
`;
