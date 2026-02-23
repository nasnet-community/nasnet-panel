/**
 * Traceroute Diagnostic Tool Types
 *
 * Type definitions for the traceroute diagnostic tool component.
 * Defines interfaces for traceroute results, hops, and component props.
 *
 * The tool supports ICMP, UDP, and TCP protocols for discovering network hops
 * with real-time progress streaming via GraphQL subscriptions.
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
    /** Optional callback when traceroute completes with final result */
    onComplete?: (result: TracerouteResult) => void;
    /** Optional callback when traceroute fails with error message */
    onError?: (error: string) => void;
    /** Optional callback when traceroute is cancelled by user */
    onCancelled?: () => void;
    /** Optional callback when each hop is discovered (for live progress UI) */
    onHopDiscovered?: (hop: TracerouteHop) => void;
}
/**
 * Form values for traceroute input
 * Passed to runTraceroute mutation and validated by tracerouteFormSchema
 */
export interface TracerouteFormValues {
    /** Target hostname or IP address (IPv4, IPv6, or FQDN) */
    target: string;
    /** Maximum number of hops to probe (1-64, default: 30) */
    maxHops?: number;
    /** Timeout per hop in milliseconds (100-30000, default: 3000) */
    timeout?: number;
    /** Number of probes per hop for redundancy (1-5, default: 3) */
    probeCount?: number;
    /** Protocol to use for probes: ICMP (default), UDP, or TCP */
    protocol?: TracerouteProtocol;
}
//# sourceMappingURL=TracerouteTool.types.d.ts.map