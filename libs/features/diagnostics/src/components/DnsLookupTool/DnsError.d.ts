/**
 * DNS Lookup Tool - Error Display Component
 *
 * Displays DNS lookup errors with user-friendly messages and actionable suggestions
 * based on the error type (NXDOMAIN, SERVFAIL, TIMEOUT, REFUSED, NETWORK_ERROR).
 *
 * @see Story NAS-5.9 - Implement DNS Lookup Tool - Task 5.9.8
 */
import type { DnsLookupResult } from './DnsLookupTool.types';
export interface DnsErrorProps {
    result: DnsLookupResult;
    className?: string;
}
export declare const DnsError: import("react").NamedExoticComponent<DnsErrorProps>;
//# sourceMappingURL=DnsError.d.ts.map