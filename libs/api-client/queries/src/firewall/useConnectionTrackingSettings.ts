/**
 * TanStack Query hook for fetching connection tracking settings
 * NAS-7.4: Connection Tracking - Settings Query Layer
 * Uses rosproxy backend for RouterOS API communication
 *
 * Endpoint: GET /rest/ip/firewall/connection/tracking
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import type { ConnectionTrackingSettings } from '@nasnet/core/types';
import { firewallConnectionKeys } from './queryKeys';

// ============================================================================
// Raw API Types
// ============================================================================

/**
 * Raw API response structure from MikroTik RouterOS
 * RouterOS REST API returns hyphenated keys that need transformation
 */
interface RawConnectionTrackingSettings {
  enabled: string; // "true" or "false"
  'max-entries': string;
  'generic-timeout': string;
  'tcp-established-timeout': string;
  'tcp-time-wait-timeout': string;
  'tcp-close-timeout': string;
  'tcp-syn-sent-timeout': string;
  'tcp-syn-received-timeout': string;
  'tcp-fin-wait-timeout': string;
  'tcp-close-wait-timeout': string;
  'tcp-last-ack-timeout': string;
  'udp-timeout': string;
  'udp-stream-timeout': string;
  'icmp-timeout': string;
  'loose-tcp-tracking': string; // "yes" or "no"
}

// ============================================================================
// Transform Functions
// ============================================================================

/**
 * Parse timeout duration string to seconds
 * Formats: "1d2h3m4s", "5h", "30m", "60s"
 * Returns total seconds
 */
function parseTimeoutToSeconds(timeout: string): number {
  const dayMatch = timeout.match(/(\d+)d/);
  const hourMatch = timeout.match(/(\d+)h/);
  const minuteMatch = timeout.match(/(\d+)m/);
  const secondMatch = timeout.match(/(\d+)s/);

  const days = dayMatch ? parseInt(dayMatch[1], 10) : 0;
  const hours = hourMatch ? parseInt(hourMatch[1], 10) : 0;
  const minutes = minuteMatch ? parseInt(minuteMatch[1], 10) : 0;
  const seconds = secondMatch ? parseInt(secondMatch[1], 10) : 0;

  return days * 86400 + hours * 3600 + minutes * 60 + seconds;
}

/**
 * Transform raw API response to ConnectionTrackingSettings type
 * Maps hyphenated keys to camelCase and converts string values
 */
function transformSettings(raw: RawConnectionTrackingSettings): ConnectionTrackingSettings {
  return {
    enabled: raw.enabled === 'true',
    maxEntries: parseInt(raw['max-entries'], 10),
    genericTimeout: parseTimeoutToSeconds(raw['generic-timeout']),
    tcpEstablishedTimeout: parseTimeoutToSeconds(raw['tcp-established-timeout']),
    tcpTimeWaitTimeout: parseTimeoutToSeconds(raw['tcp-time-wait-timeout']),
    tcpCloseTimeout: parseTimeoutToSeconds(raw['tcp-close-timeout']),
    tcpSynSentTimeout: parseTimeoutToSeconds(raw['tcp-syn-sent-timeout']),
    tcpSynReceivedTimeout: parseTimeoutToSeconds(raw['tcp-syn-received-timeout']),
    tcpFinWaitTimeout: parseTimeoutToSeconds(raw['tcp-fin-wait-timeout']),
    tcpCloseWaitTimeout: parseTimeoutToSeconds(raw['tcp-close-wait-timeout']),
    tcpLastAckTimeout: parseTimeoutToSeconds(raw['tcp-last-ack-timeout']),
    udpTimeout: parseTimeoutToSeconds(raw['udp-timeout']),
    udpStreamTimeout: parseTimeoutToSeconds(raw['udp-stream-timeout']),
    icmpTimeout: parseTimeoutToSeconds(raw['icmp-timeout']),
    looseTracking: raw['loose-tcp-tracking'] === 'yes',
  };
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetches connection tracking settings from RouterOS via rosproxy
 * Endpoint: GET /rest/ip/firewall/connection/tracking
 *
 * @param routerIp - Target router IP address
 * @returns Promise with connection tracking settings
 */
async function fetchConnectionTrackingSettings(
  routerIp: string
): Promise<ConnectionTrackingSettings> {
  const result = await makeRouterOSRequest<RawConnectionTrackingSettings>(
    routerIp,
    'ip/firewall/connection/tracking'
  );

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch connection tracking settings');
  }

  return transformSettings(result.data);
}

// ============================================================================
// React Query Hooks
// ============================================================================

export interface UseConnectionTrackingSettingsOptions {
  /**
   * Target router IP address
   */
  routerIp: string;

  /**
   * Skip query execution if true
   */
  enabled?: boolean;
}

/**
 * React Query hook for connection tracking settings
 *
 * Fetches the global connection tracking configuration including:
 * - Whether tracking is enabled
 * - Maximum connection table size
 * - Timeout values for different protocols and states
 * - Loose tracking mode
 *
 * @param options - Hook configuration options
 * @returns Query result with connection tracking settings
 *
 * @example
 * ```tsx
 * function ConnectionTrackingSettings() {
 *   const routerIp = useConnectionStore(state => state.currentRouterIp);
 *   const { data: settings, isLoading } = useConnectionTrackingSettings({
 *     routerIp: routerIp || '',
 *   });
 *
 *   if (isLoading) return <Spinner />;
 *
 *   return (
 *     <Card>
 *       <CardHeader>Connection Tracking</CardHeader>
 *       <CardContent>
 *         <div>Status: {settings?.enabled ? 'Enabled' : 'Disabled'}</div>
 *         <div>Max Entries: {settings?.maxEntries.toLocaleString()}</div>
 *         <div>TCP Established Timeout: {settings?.tcpEstablishedTimeout}s</div>
 *         <div>UDP Timeout: {settings?.udpTimeout}s</div>
 *       </CardContent>
 *     </Card>
 *   );
 * }
 * ```
 */
export function useConnectionTrackingSettings({
  routerIp,
  enabled = true,
}: UseConnectionTrackingSettingsOptions): UseQueryResult<ConnectionTrackingSettings, Error> {
  return useQuery({
    queryKey: firewallConnectionKeys.tracking(routerIp),
    queryFn: () => fetchConnectionTrackingSettings(routerIp),
    staleTime: 60_000, // 1 minute - settings don't change frequently
    retry: 2,
    enabled: enabled && !!routerIp,
  });
}
