/**
 * Connection Tracking Settings Types
 *
 * Import official types from @nasnet/core/types and add form-specific types.
 */

// Import official type from core
import type { ConnectionTrackingSettings } from '@nasnet/core/types';

// Re-export for convenience
export type { ConnectionTrackingSettings };

/**
 * Form values for connection tracking settings
 * Uses string format for duration inputs
 */
export interface ConnectionTrackingFormValues {
  enabled: boolean;
  maxEntries: string; // String for form input
  genericTimeout: string; // Duration string (e.g., "10m", "600s")
  tcpEstablishedTimeout: string;
  tcpTimeWaitTimeout: string;
  tcpCloseTimeout: string;
  tcpSynSentTimeout: string;
  tcpSynReceivedTimeout: string;
  tcpFinWaitTimeout: string;
  tcpCloseWaitTimeout: string;
  tcpLastAckTimeout: string;
  udpTimeout: string;
  udpStreamTimeout: string;
  icmpTimeout: string;
  looseTracking: boolean;
}

/**
 * Default connection tracking settings
 */
export const DEFAULT_SETTINGS: ConnectionTrackingSettings = {
  enabled: true,
  maxEntries: 262144, // 256K default on MikroTik
  genericTimeout: 600, // 10 minutes
  tcpEstablishedTimeout: 86400, // 1 day
  tcpTimeWaitTimeout: 120, // 2 minutes
  tcpCloseTimeout: 10, // 10 seconds
  tcpSynSentTimeout: 120, // 2 minutes
  tcpSynReceivedTimeout: 60, // 1 minute
  tcpFinWaitTimeout: 120, // 2 minutes
  tcpCloseWaitTimeout: 60, // 1 minute
  tcpLastAckTimeout: 30, // 30 seconds
  udpTimeout: 180, // 3 minutes
  udpStreamTimeout: 180, // 3 minutes
  icmpTimeout: 30, // 30 seconds
  looseTracking: false,
};
