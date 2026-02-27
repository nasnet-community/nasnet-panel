/**
 * Diagnostics Query Hooks
 * Apollo Client hooks for internet troubleshooting (NAS-5.11)
 */

import { useQuery, useMutation, useSubscription } from '@apollo/client';
import type {
  QueryHookOptions,
  MutationHookOptions,
  SubscriptionHookOptions,
} from '@apollo/client';
import {
  GET_TROUBLESHOOT_SESSION,
  DETECT_WAN_INTERFACE,
  DETECT_GATEWAY,
  DETECT_ISP,
  START_TROUBLESHOOT,
  RUN_TROUBLESHOOT_STEP,
  APPLY_TROUBLESHOOT_FIX,
  VERIFY_TROUBLESHOOT_FIX,
  CANCEL_TROUBLESHOOT,
  TROUBLESHOOT_PROGRESS,
} from './operations';
import type {
  TroubleshootSession,
  StartTroubleshootPayload,
  RunTroubleshootStepPayload,
  ApplyFixPayload,
  ISPInfo,
  TroubleshootStepType,
} from './types';

// -----------------------------------------------------------------------------
// Query Hooks
// -----------------------------------------------------------------------------

/**
 * Get a troubleshooting session by ID
 */
export function useTroubleshootSession(
  sessionId: string,
  options?: Omit<QueryHookOptions, 'variables'>
) {
  return useQuery(GET_TROUBLESHOOT_SESSION, {
    variables: { id: sessionId },
    ...options,
  } as any);
}

/**
 * Detect WAN interface from default route
 */
export function useDetectWanInterface(
  routerId: string,
  options?: Omit<QueryHookOptions, 'variables'>
) {
  return useQuery(DETECT_WAN_INTERFACE, {
    variables: { routerId },
    ...options,
  } as any);
}

/**
 * Detect default gateway from DHCP client or static route
 */
export function useDetectGateway(routerId: string, options?: Omit<QueryHookOptions, 'variables'>) {
  return useQuery(DETECT_GATEWAY, {
    variables: { routerId },
    ...options,
  } as any);
}

/**
 * Detect ISP information from WAN IP
 */
export function useDetectISP(routerId: string, options?: Omit<QueryHookOptions, 'variables'>) {
  return useQuery(DETECT_ISP, {
    variables: { routerId },
    ...options,
  } as any);
}

// -----------------------------------------------------------------------------
// Mutation Hooks
// -----------------------------------------------------------------------------

/**
 * Start a new troubleshooting session
 */
export function useStartTroubleshoot(options?: MutationHookOptions) {
  return useMutation(START_TROUBLESHOOT, options);
}

/**
 * Run a specific diagnostic step
 */
export function useRunTroubleshootStep(options?: MutationHookOptions) {
  return useMutation(RUN_TROUBLESHOOT_STEP, options);
}

/**
 * Apply a suggested fix
 */
export function useApplyTroubleshootFix(options?: MutationHookOptions) {
  return useMutation(APPLY_TROUBLESHOOT_FIX, options);
}

/**
 * Verify a fix by re-running the diagnostic step
 */
export function useVerifyTroubleshootFix(options?: MutationHookOptions) {
  return useMutation(VERIFY_TROUBLESHOOT_FIX, options);
}

/**
 * Cancel a troubleshooting session
 */
export function useCancelTroubleshoot(options?: MutationHookOptions) {
  return useMutation(CANCEL_TROUBLESHOOT, options);
}

// -----------------------------------------------------------------------------
// Subscription Hooks
// -----------------------------------------------------------------------------

/**
 * Subscribe to troubleshooting session progress
 */
export function useTroubleshootProgress(
  sessionId: string,
  options?: Omit<SubscriptionHookOptions, 'variables'>
) {
  return useSubscription(TROUBLESHOOT_PROGRESS, {
    variables: { sessionId },
    ...options,
  } as any);
}
