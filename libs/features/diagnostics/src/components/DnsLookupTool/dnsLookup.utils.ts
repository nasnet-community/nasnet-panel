/**
 * DNS Lookup Tool - Utility Functions
 *
 * Provides formatting and helper functions for DNS records including
 * record value formatting, TTL conversion, priority sorting, and error messages.
 *
 * @see Story NAS-5.9 - Implement DNS Lookup Tool
 */

import type { DnsRecord, DnsRecordType, DnsLookupStatus } from './DnsLookupTool.types';

/**
 * Format record value for display based on record type
 */
export function formatRecordValue(record: DnsRecord): string {
  switch (record.type) {
    case 'A':
    case 'AAAA':
      return record.data;
    case 'MX':
      return `${record.priority} ${record.data}`;
    case 'TXT':
      return `"${record.data}"`;
    case 'CNAME':
    case 'NS':
    case 'PTR':
      return record.data;
    case 'SOA':
      return record.data;
    case 'SRV':
      return `${record.priority} ${record.weight} ${record.port} ${record.data}`;
    default:
      return record.data;
  }
}

/**
 * Format TTL in human-readable form
 */
export function formatTTL(ttlSeconds: number): string {
  if (ttlSeconds < 60) {
    return `${ttlSeconds}s`;
  }
  if (ttlSeconds < 3600) {
    const minutes = Math.floor(ttlSeconds / 60);
    return `${minutes}m`;
  }
  if (ttlSeconds < 86400) {
    const hours = Math.floor(ttlSeconds / 3600);
    return `${hours}h`;
  }
  const days = Math.floor(ttlSeconds / 86400);
  return `${days}d`;
}

/**
 * Sort records by priority (for MX and SRV)
 */
export function sortRecordsByPriority(records: DnsRecord[]): DnsRecord[] {
  return [...records].sort((a, b) => {
    if (a.priority !== undefined && b.priority !== undefined) {
      return a.priority - b.priority;
    }
    return 0;
  });
}

/**
 * Get human-readable description for record type
 */
export function getRecordTypeDescription(type: DnsRecordType): string {
  const descriptions: Record<DnsRecordType, string> = {
    A: 'IPv4 Address',
    AAAA: 'IPv6 Address',
    MX: 'Mail Exchange',
    TXT: 'Text Record',
    CNAME: 'Canonical Name (Alias)',
    NS: 'Name Server',
    PTR: 'Pointer (Reverse DNS)',
    SOA: 'Start of Authority',
    SRV: 'Service Record',
  };
  return descriptions[type] || type;
}

/**
 * Get user-friendly error message from status
 */
export function getErrorMessage(status: DnsLookupStatus): string {
  switch (status) {
    case 'NXDOMAIN':
      return 'Domain does not exist. Check spelling or verify the domain is registered.';
    case 'SERVFAIL':
      return 'DNS server failed to resolve. The server may be experiencing issues.';
    case 'TIMEOUT':
      return 'Query timed out. Try a different DNS server or increase timeout.';
    case 'REFUSED':
      return 'Query refused by server. The DNS server may not allow this query.';
    case 'NETWORK_ERROR':
      return 'Cannot reach DNS server. Check network connectivity.';
    default:
      return 'Unknown error occurred.';
  }
}

/**
 * Check if status is an error
 */
export function isErrorStatus(status: DnsLookupStatus): boolean {
  return status !== 'SUCCESS';
}
