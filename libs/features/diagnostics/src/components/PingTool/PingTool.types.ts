/**
 * Ping Diagnostic Tool Types
 *
 * Type definitions for the ping diagnostic tool component.
 * Defines interfaces for ping results, statistics, and job status.
 */

/**
 * Single ping result from router
 */
export interface PingResult {
  /** Sequence number */
  seq: number;
  /** Bytes received (typically 56 for IPv4) */
  bytes: number | null;
  /** TTL (time to live) */
  ttl: number | null;
  /** Round-trip time in milliseconds (null if timeout) */
  time: number | null;
  /** Target address */
  target: string;
  /** Source interface (if specified) */
  source: string | null;
  /** Error message (if failed) */
  error: string | null;
  /** Timestamp of this result */
  timestamp: Date;
}

/**
 * Ping statistics summary
 */
export interface PingStatistics {
  /** Packets sent */
  sent: number;
  /** Packets received */
  received: number;
  /** Packets lost */
  lost: number;
  /** Loss percentage (0-100) */
  lossPercent: number;
  /** Minimum RTT in ms (null if no successful pings) */
  minRtt: number | null;
  /** Average RTT in ms (null if no successful pings) */
  avgRtt: number | null;
  /** Maximum RTT in ms (null if no successful pings) */
  maxRtt: number | null;
  /** Standard deviation in ms (null if no successful pings) */
  stdDev: number | null;
}

/**
 * Ping job status
 */
export enum PingJobStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETE = 'COMPLETE',
  STOPPED = 'STOPPED',
  ERROR = 'ERROR',
}

/**
 * Props for PingTool component
 */
export interface PingToolProps {
  /** Router ID to run ping from */
  routerId: string;
  /** Optional callback when ping completes */
  onComplete?: () => void;
  /** Optional callback when ping fails */
  onError?: (error: string) => void;
}
