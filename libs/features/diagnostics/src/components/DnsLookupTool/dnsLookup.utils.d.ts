/**
 * DNS Lookup Tool - Utility Functions
 *
 * Provides formatting and helper functions for DNS records including
 * record value formatting, TTL conversion, priority sorting, and error messages.
 *
 * @see Story NAS-5.9 - Implement DNS Lookup Tool
 * @example
 * ```tsx
 * const value = formatRecordValue({ type: 'A', data: '8.8.8.8' });
 * const ttl = formatTTL(3600); // "1h"
 * const sorted = sortRecordsByPriority(mxRecords);
 * ```
 */
import type { DnsRecord, DnsRecordType, DnsLookupStatus } from './DnsLookupTool.types';
/**
 * Format record value for display based on record type.
 *
 * @param record - The DNS record to format
 * @returns Formatted record value string, e.g., "8.8.8.8" for A records, "10 mail.example.com" for MX
 * @example
 * formatRecordValue({ type: 'A', data: '8.8.8.8' }) // "8.8.8.8"
 * formatRecordValue({ type: 'MX', data: 'mail.example.com', priority: 10 }) // "10 mail.example.com"
 */
export declare function formatRecordValue(record: DnsRecord): string;
/**
 * Format TTL in human-readable form.
 *
 * @param ttlSeconds - TTL value in seconds
 * @returns Formatted TTL string, e.g., "1h", "30m", "3d"
 * @example
 * formatTTL(3600) // "1h"
 * formatTTL(300) // "5m"
 */
export declare function formatTTL(ttlSeconds: number): string;
/**
 * Sort records by priority (for MX and SRV records).
 *
 * @param records - Array of DNS records to sort
 * @returns New sorted array ordered by priority ascending (lower priority first)
 * @example
 * sortRecordsByPriority(mxRecords) // Sorted by MX priority
 */
export declare function sortRecordsByPriority(records: DnsRecord[]): DnsRecord[];
/**
 * Get human-readable description for DNS record type.
 *
 * @param type - The DNS record type code (e.g., "A", "MX")
 * @returns Descriptive name for the record type
 * @example
 * getRecordTypeDescription('A') // "IPv4 Address"
 * getRecordTypeDescription('MX') // "Mail Exchange"
 */
export declare function getRecordTypeDescription(type: DnsRecordType): string;
/**
 * Get user-friendly error message from DNS lookup status.
 *
 * @param status - The DNS lookup status code
 * @returns Human-readable error message with remediation hint
 * @example
 * getErrorMessage('NXDOMAIN') // "Domain does not exist. Check spelling or verify the domain is registered."
 * getErrorMessage('TIMEOUT') // "Query timed out. Try a different DNS server or increase timeout."
 */
export declare function getErrorMessage(status: DnsLookupStatus): string;
/**
 * Check if DNS lookup status represents an error.
 *
 * @param status - The DNS lookup status code
 * @returns true if status indicates an error, false if SUCCESS
 * @example
 * isErrorStatus('TIMEOUT') // true
 * isErrorStatus('SUCCESS') // false
 */
export declare function isErrorStatus(status: DnsLookupStatus): boolean;
//# sourceMappingURL=dnsLookup.utils.d.ts.map