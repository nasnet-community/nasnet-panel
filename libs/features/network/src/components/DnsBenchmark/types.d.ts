/**
 * DNS Benchmark Component Types
 * NAS-6.12: DNS Cache & Diagnostics - Task 5
 */
import type { DnsServerStatus } from '@nasnet/api-client/generated';
/**
 * Single DNS server benchmark result
 */
export interface DnsBenchmarkServerResult {
    server: string;
    responseTimeMs: number;
    status: DnsServerStatus;
    success: boolean;
    error?: string | null;
}
/**
 * Complete benchmark result
 */
export interface DnsBenchmarkResult {
    testHostname: string;
    serverResults: DnsBenchmarkServerResult[];
    fastestServer?: DnsBenchmarkServerResult | null;
    timestamp: string;
    totalTimeMs: number;
}
/**
 * Props for DNS Benchmark component
 */
export interface DnsBenchmarkProps {
    /**
     * Device/router ID to run benchmark on
     */
    deviceId: string;
    /**
     * Whether to auto-run benchmark on mount
     * @default false
     */
    autoRun?: boolean;
    /**
     * Callback when benchmark completes successfully
     */
    onSuccess?: (result: DnsBenchmarkResult) => void;
    /**
     * Callback when benchmark fails
     */
    onError?: (error: string) => void;
    /**
     * Custom CSS class name
     */
    className?: string;
}
//# sourceMappingURL=types.d.ts.map