/**
 * DNS Lookup Tool - Type Definitions
 *
 * Defines types for DNS record lookups including supported record types,
 * lookup results, and DNS server configuration.
 *
 * @see Story NAS-5.9 - Implement DNS Lookup Tool
 */

export const DNS_RECORD_TYPES = [
  'A',
  'AAAA',
  'MX',
  'TXT',
  'CNAME',
  'NS',
  'PTR',
  'SOA',
  'SRV',
] as const;

export type DnsRecordType = (typeof DNS_RECORD_TYPES)[number];

export type DnsLookupStatus =
  | 'SUCCESS'
  | 'NXDOMAIN'
  | 'SERVFAIL'
  | 'TIMEOUT'
  | 'REFUSED'
  | 'NETWORK_ERROR';

export interface DnsRecord {
  name: string;
  type: DnsRecordType;
  ttl: number;
  data: string;
  priority?: number; // MX, SRV
  weight?: number; // SRV
  port?: number; // SRV
}

export interface DnsLookupResult {
  hostname: string;
  recordType: DnsRecordType;
  status: DnsLookupStatus;
  records: DnsRecord[];
  server: string;
  queryTime: number; // milliseconds
  authoritative: boolean;
  error: string | null;
  timestamp: string;
}

export interface DnsServer {
  address: string;
  isPrimary: boolean;
  isSecondary: boolean;
}
