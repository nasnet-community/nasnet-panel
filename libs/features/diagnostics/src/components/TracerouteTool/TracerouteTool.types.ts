/**
 * Traceroute Diagnostic Tool Types
 *
 * Type definitions for the traceroute diagnostic tool component.
 * Defines interfaces for traceroute results, hops, and component props.
 */

import type { TracerouteHop, TracerouteResult, TracerouteProtocol } from '@nasnet/api-client/generated/types';

/**
 * Re-export generated types for convenience
 */
export type { TracerouteHop, TracerouteResult, TracerouteProtocol };

/**
 * Props for TracerouteTool component
 */
export interface TracerouteToolProps {
  /** Router ID to run traceroute from */
  routerId: string;
  /** Optional callback when traceroute completes */
  onComplete?: (result: TracerouteResult) => void;
  /** Optional callback when traceroute fails */
  onError?: (error: string) => void;
  /** Optional callback when traceroute is cancelled */
  onCancelled?: () => void;
  /** Optional callback when each hop is discovered */
  onHopDiscovered?: (hop: TracerouteHop) => void;
}

/**
 * Form values for traceroute input
 */
export interface TracerouteFormValues {
  /** Target hostname or IP address */
  target: string;
  /** Maximum number of hops (1-64, default: 30) */
  maxHops?: number;
  /** Timeout per hop in milliseconds (100-30000, default: 3000) */
  timeout?: number;
  /** Number of probes per hop (1-5, default: 3) */
  probeCount?: number;
  /** Protocol to use (ICMP, UDP, TCP) */
  protocol?: TracerouteProtocol;
}
