/**
 * DNS Cache Panel Component Types
 * NAS-6.12: DNS Cache & Diagnostics - Task 6
 */

/**
 * DNS cache statistics
 */
export interface DnsCacheStats {
  totalEntries: number;
  cacheUsedBytes: number;
  cacheMaxBytes: number;
  cacheUsagePercent: number;
  hitRatePercent?: number | null;
  topDomains: DnsTopDomain[];
  timestamp: string;
}

/**
 * Frequently queried domain
 */
export interface DnsTopDomain {
  domain: string;
  queryCount: number;
  lastQueried?: string | null;
}

/**
 * Flush cache result
 */
export interface FlushDnsCacheResult {
  success: boolean;
  entriesRemoved: number;
  beforeStats: Partial<DnsCacheStats>;
  afterStats: Partial<DnsCacheStats>;
  message: string;
  timestamp: string;
}

/**
 * Props for DNS Cache Panel component
 */
export interface DnsCachePanelProps {
  /**
   * Device/router ID
   */
  deviceId: string;

  /**
   * Whether to enable automatic polling (default: true)
   */
  enablePolling?: boolean;

  /**
   * Callback when cache is flushed successfully
   */
  onFlushSuccess?: (result: FlushDnsCacheResult) => void;

  /**
   * Callback when flush fails
   */
  onFlushError?: (error: string) => void;

  /**
   * Custom CSS class name
   */
  className?: string;
}
