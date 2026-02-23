/**
 * DNS Lookup Tool - Custom Hook
 *
 * Headless hook for DNS lookup functionality providing data fetching,
 * single/multi-server queries, and state management using Apollo Client.
 *
 * @description Provides stateful DNS lookup operations including:
 * - Single-server lookups with configurable timeout
 * - Multi-server comparison across all configured DNS servers
 * - Automatic error handling and retry logic
 * - Real-time result updates via Apollo Client subscriptions
 *
 * @see Story NAS-5.9 - Implement DNS Lookup Tool - Task 5.9.4
 * @see ADR-002 State Management (Apollo Client for router data)
 * @see ADR-018 Headless + Platform Presenters Pattern
 * @example
 * ```tsx
 * const hook = useDnsLookup({ deviceId: 'router-1' });
 * await hook.lookup({ hostname: 'example.com', recordType: 'A' });
 * // hook.result contains { hostname, records, queryTime, status, ... }
 * ```
 */
import type { DnsLookupResult, DnsServer } from './DnsLookupTool.types';
import type { DnsLookupFormValues } from './dnsLookup.schema';
interface UseDnsLookupOptions {
    /** Device/router ID to run lookups against */
    deviceId: string;
    /** Callback invoked on successful lookup (status: SUCCESS) */
    onSuccess?: (result: DnsLookupResult) => void;
    /** Callback invoked on query failure or network error */
    onError?: (error: string) => void;
}
export declare function useDnsLookup({ deviceId, onSuccess, onError }: UseDnsLookupOptions): {
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    result: DnsLookupResult | null;
    comparisonResults: DnsLookupResult[];
    dnsServers: DnsServer[];
    primaryServer: string | undefined;
    secondaryServer: string | undefined;
    lookup: (values: DnsLookupFormValues) => Promise<void>;
    lookupAll: (values: DnsLookupFormValues) => Promise<void>;
    reset: () => void;
};
export {};
//# sourceMappingURL=useDnsLookup.d.ts.map