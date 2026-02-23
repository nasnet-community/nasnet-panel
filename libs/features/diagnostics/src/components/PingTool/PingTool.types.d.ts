/**
 * Ping Diagnostic Tool Types
 *
 * Type definitions for the ping diagnostic tool component.
 * Defines interfaces for ping results, statistics, and job status.
 */
/**
 * Single ping result from router
 *
 * Represents one individual ping request/response in a test sequence.
 * Each ping receives a unique sequence number and either a successful RTT
 * measurement or an error indication.
 */
export interface PingResult {
    /** Sequence number (1-indexed for user-friendly display) */
    seq: number;
    /** Bytes received in response (typically 56 for IPv4, null if timeout/error) */
    bytes: number | null;
    /** TTL (time to live) from response header (null if timeout/error) */
    ttl: number | null;
    /** Round-trip time in milliseconds (null if timeout or DNS failure) */
    time: number | null;
    /** Target address that was pinged */
    target: string;
    /** Source interface used to send this ping (null if using default interface) */
    source: string | null;
    /** Error message if the ping failed (null on success) */
    error: string | null;
    /** ISO 8601 timestamp when the router sent this ping */
    timestamp: Date;
}
/**
 * Ping statistics summary calculated from results array
 *
 * Computed automatically from PingResult[] to provide overview metrics.
 * RTT values use monospace font (font-mono) in UI for data readability.
 * All null values indicate no successful pings were received.
 */
export interface PingStatistics {
    /** Total packets sent in this test */
    sent: number;
    /** Packets that received successful replies */
    received: number;
    /** Packets that did not receive replies (timeouts + failures) */
    lost: number;
    /** Loss percentage: (lost / sent) * 100, range 0-100 */
    lossPercent: number;
    /** Minimum round-trip time across all successful pings in milliseconds (null if no replies) */
    minRtt: number | null;
    /** Average round-trip time across all successful pings in milliseconds (null if no replies) */
    avgRtt: number | null;
    /** Maximum round-trip time across all successful pings in milliseconds (null if no replies) */
    maxRtt: number | null;
    /** Standard deviation of RTT across all successful pings in milliseconds (null if <2 successful pings) */
    stdDev: number | null;
}
/**
 * Ping job status enum
 *
 * Tracks state of a ping diagnostic job on the router.
 * Used by XState machine and returned in subscription responses.
 */
export declare enum PingJobStatus {
    /** Job created but not yet started by the router */
    PENDING = "PENDING",
    /** Router is actively sending/receiving ping packets */
    RUNNING = "RUNNING",
    /** All pings completed successfully (count reached or user stopped) */
    COMPLETE = "COMPLETE",
    /** User explicitly stopped the job before completion */
    STOPPED = "STOPPED",
    /** Job encountered an error (network failure, invalid target, etc.) */
    ERROR = "ERROR"
}
/**
 * Props for PingTool component
 *
 * PingTool provides a complete UI for running ping diagnostics.
 * It includes form input, real-time results visualization, and statistics.
 */
export interface PingToolProps {
    /** Router ID where the ping test will be executed */
    routerId: string;
    /** Optional callback fired when ping test completes successfully (all pings sent or user stopped) */
    onComplete?: () => void;
    /** Optional callback fired if ping test encounters an error (mutation failed, subscription error, etc.) with error message */
    onError?: (error: string) => void;
}
//# sourceMappingURL=PingTool.types.d.ts.map