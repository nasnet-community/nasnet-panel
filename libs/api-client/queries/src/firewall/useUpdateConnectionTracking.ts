/**
 * TanStack Query mutation hook for updating connection tracking settings
 * NAS-7.4: Connection Tracking - Settings Mutation Layer
 * Uses rosproxy backend for RouterOS API communication
 *
 * Endpoint: PATCH /rest/ip/firewall/connection/tracking/set
 */

import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import type { ConnectionTrackingSettings } from '@nasnet/core/types';
import { firewallConnectionKeys } from './queryKeys';

// ============================================================================
// API Types
// ============================================================================

/**
 * Partial update payload for connection tracking settings
 * All fields are optional - only provided fields will be updated
 */
export interface UpdateConnectionTrackingInput {
  enabled?: boolean;
  maxEntries?: number;
  genericTimeout?: number; // seconds
  tcpEstablishedTimeout?: number;
  tcpTimeWaitTimeout?: number;
  tcpCloseTimeout?: number;
  tcpSynSentTimeout?: number;
  tcpSynReceivedTimeout?: number;
  tcpFinWaitTimeout?: number;
  tcpCloseWaitTimeout?: number;
  tcpLastAckTimeout?: number;
  udpTimeout?: number;
  udpStreamTimeout?: number;
  icmpTimeout?: number;
  looseTracking?: boolean;
}

/**
 * Variables for update mutation
 */
export interface UpdateConnectionTrackingVariables {
  /**
   * Target router IP address
   */
  routerIp: string;

  /**
   * Settings to update (partial)
   */
  settings: UpdateConnectionTrackingInput;
}

// ============================================================================
// Transform Functions
// ============================================================================

/**
 * Convert seconds to RouterOS duration string
 * Format: "1d2h3m4s"
 */
function secondsToRouterOSDuration(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  seconds %= 86400;
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join('');
}

/**
 * Transform camelCase settings to RouterOS kebab-case format
 */
function transformToRouterOSFormat(
  settings: UpdateConnectionTrackingInput
): Record<string, string> {
  const payload: Record<string, string> = {};

  if (settings.enabled !== undefined) {
    payload.enabled = settings.enabled ? 'true' : 'false';
  }

  if (settings.maxEntries !== undefined) {
    payload['max-entries'] = settings.maxEntries.toString();
  }

  if (settings.genericTimeout !== undefined) {
    payload['generic-timeout'] = secondsToRouterOSDuration(settings.genericTimeout);
  }

  if (settings.tcpEstablishedTimeout !== undefined) {
    payload['tcp-established-timeout'] = secondsToRouterOSDuration(settings.tcpEstablishedTimeout);
  }

  if (settings.tcpTimeWaitTimeout !== undefined) {
    payload['tcp-time-wait-timeout'] = secondsToRouterOSDuration(settings.tcpTimeWaitTimeout);
  }

  if (settings.tcpCloseTimeout !== undefined) {
    payload['tcp-close-timeout'] = secondsToRouterOSDuration(settings.tcpCloseTimeout);
  }

  if (settings.tcpSynSentTimeout !== undefined) {
    payload['tcp-syn-sent-timeout'] = secondsToRouterOSDuration(settings.tcpSynSentTimeout);
  }

  if (settings.tcpSynReceivedTimeout !== undefined) {
    payload['tcp-syn-received-timeout'] = secondsToRouterOSDuration(settings.tcpSynReceivedTimeout);
  }

  if (settings.tcpFinWaitTimeout !== undefined) {
    payload['tcp-fin-wait-timeout'] = secondsToRouterOSDuration(settings.tcpFinWaitTimeout);
  }

  if (settings.tcpCloseWaitTimeout !== undefined) {
    payload['tcp-close-wait-timeout'] = secondsToRouterOSDuration(settings.tcpCloseWaitTimeout);
  }

  if (settings.tcpLastAckTimeout !== undefined) {
    payload['tcp-last-ack-timeout'] = secondsToRouterOSDuration(settings.tcpLastAckTimeout);
  }

  if (settings.udpTimeout !== undefined) {
    payload['udp-timeout'] = secondsToRouterOSDuration(settings.udpTimeout);
  }

  if (settings.udpStreamTimeout !== undefined) {
    payload['udp-stream-timeout'] = secondsToRouterOSDuration(settings.udpStreamTimeout);
  }

  if (settings.icmpTimeout !== undefined) {
    payload['icmp-timeout'] = secondsToRouterOSDuration(settings.icmpTimeout);
  }

  if (settings.looseTracking !== undefined) {
    payload['loose-tcp-tracking'] = settings.looseTracking ? 'yes' : 'no';
  }

  return payload;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Updates connection tracking settings on RouterOS via rosproxy
 * Endpoint: POST /rest/ip/firewall/connection/tracking/set
 *
 * @param variables - Router IP and settings to update
 * @returns Promise that resolves when settings are updated
 */
async function updateConnectionTrackingSettings(
  variables: UpdateConnectionTrackingVariables
): Promise<void> {
  const { routerIp, settings } = variables;

  const payload = transformToRouterOSFormat(settings);

  // RouterOS REST API uses POST to /rest/ip/firewall/connection/tracking/set
  const result = await makeRouterOSRequest<void>(routerIp, 'ip/firewall/connection/tracking/set', {
    method: 'POST',
    body: {
      '.id': '*0', // Connection tracking settings have a single entry with ID *0
      ...payload,
    },
  });

  if (!result.success) {
    throw new Error(result.error || 'Failed to update connection tracking settings');
  }
}

// ============================================================================
// React Query Hooks
// ============================================================================

export interface UseUpdateConnectionTrackingOptions {
  /**
   * Target router IP address
   */
  routerIp: string;

  /**
   * Callback fired on successful update
   */
  onSuccess?: () => void;

  /**
   * Callback fired on error
   */
  onError?: (error: Error) => void;
}

/**
 * React Query mutation hook for updating connection tracking settings
 *
 * Updates the global connection tracking configuration. Only provided
 * fields will be updated - omitted fields remain unchanged.
 *
 * @param options - Hook configuration options
 * @returns Mutation result with updateSettings function
 *
 * @example
 * ```tsx
 * function ConnectionTrackingSettingsForm() {
 *   const routerIp = useConnectionStore(state => state.currentRouterIp);
 *   const { mutate: updateSettings, isPending } = useUpdateConnectionTracking({
 *     routerIp: routerIp || '',
 *     onSuccess: () => toast.success('Settings updated'),
 *     onError: (error) => toast.error(`Failed: ${error.message}`),
 *   });
 *
 *   const handleSubmit = (values: UpdateConnectionTrackingInput) => {
 *     updateSettings({ settings: values });
 *   };
 *
 *   return (
 *     <Form onSubmit={handleSubmit}>
 *       <FormField name="enabled" label="Connection Tracking Enabled" />
 *       <FormField name="maxEntries" label="Max Entries" type="number" />
 *       <FormField name="tcpEstablishedTimeout" label="TCP Established Timeout (seconds)" type="number" />
 *       <Button type="submit" disabled={isPending}>
 *         {isPending ? 'Saving...' : 'Save Settings'}
 *       </Button>
 *     </Form>
 *   );
 * }
 * ```
 */
export function useUpdateConnectionTracking({
  routerIp,
  onSuccess,
  onError,
}: UseUpdateConnectionTrackingOptions): UseMutationResult<
  void,
  Error,
  Pick<UpdateConnectionTrackingVariables, 'settings'>,
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: Pick<UpdateConnectionTrackingVariables, 'settings'>) =>
      updateConnectionTrackingSettings({ routerIp, ...variables }),

    onSuccess: () => {
      // Invalidate tracking settings to trigger refetch
      queryClient.invalidateQueries({
        queryKey: firewallConnectionKeys.tracking(routerIp),
      });

      onSuccess?.();
    },

    onError: (error: Error) => {
      onError?.(error);
    },
  });
}
