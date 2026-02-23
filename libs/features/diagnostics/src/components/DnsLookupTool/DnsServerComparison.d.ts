/**
 * DNS Lookup Tool - Server Comparison Component
 *
 * Displays side-by-side comparison of DNS lookup results from multiple servers,
 * highlighting differences in query times and resolved records.
 *
 * @description Renders a grid of DNS lookup results with performance indicators.
 * Highlights the fastest response time with a success ring and visual badge.
 * Detects discrepancies when different servers return different numbers of records.
 * Includes a summary section with query statistics.
 *
 * @see Story NAS-5.9 - Implement DNS Lookup Tool - Task 5.9.7
 * @see ADR-017 Three-Layer Component Architecture
 * @example
 * ```tsx
 * <DnsServerComparison
 *   results={[
 *     { hostname: 'example.com', recordType: 'A', status: 'SUCCESS', records: [...], ... },
 *   ]}
 * />
 * ```
 */
import type { DnsLookupResult } from './DnsLookupTool.types';
export interface DnsServerComparisonProps {
    /** Array of DNS lookup results to compare */
    results: DnsLookupResult[];
    /** Optional CSS class for custom styling */
    className?: string;
}
export declare const DnsServerComparison: import("react").NamedExoticComponent<DnsServerComparisonProps>;
//# sourceMappingURL=DnsServerComparison.d.ts.map