// libs/features/diagnostics/src/graphql/traceroute.graphql.ts

import { gql } from '@apollo/client';

/**
 * Fragment for hop probe data
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
 * Fragment for traceroute hop data
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
 * Mutation to start a traceroute job
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
 * Mutation to cancel a running traceroute job
 */
export const CANCEL_TRACEROUTE = gql`
  mutation CancelTraceroute($jobId: ID!) {
    cancelTraceroute(jobId: $jobId)
  }
`;

/**
 * Subscription for traceroute progress updates
 * Emits events for:
 * - HOP_DISCOVERED: New hop discovered
 * - COMPLETE: Traceroute finished
 * - ERROR: Error occurred
 * - CANCELLED: Job was cancelled
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
