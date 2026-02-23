/**
 * DNS Lookup Tool - Results Display Component
 *
 * Displays DNS lookup results including query metadata, record table,
 * and expandable record details with copy functionality.
 *
 * @see Story NAS-5.9 - Implement DNS Lookup Tool - Task 5.9.6
 */
import type { DnsLookupResult } from './DnsLookupTool.types';
export interface DnsResultsProps {
    result: DnsLookupResult;
    className?: string;
}
export declare const DnsResults: import("react").NamedExoticComponent<DnsResultsProps>;
//# sourceMappingURL=DnsResults.d.ts.map