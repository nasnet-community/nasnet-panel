/**
 * DNS Lookup Tool - Type Definitions
 *
 * Defines types for DNS record lookups including supported record types,
 * lookup results, and DNS server configuration.
 *
 * @description Contains:
 * - DNS_RECORD_TYPES: Supported DNS record types (A, AAAA, MX, TXT, CNAME, NS, PTR, SOA, SRV)
 * - DnsLookupResult: Result of a DNS query including records and metadata
 * - DnsServer: Configured DNS server configuration on the router
 * - DnsLookupStatus: Query status (SUCCESS, NXDOMAIN, TIMEOUT, etc.)
 *
 * @see Story NAS-5.9 - Implement DNS Lookup Tool
 * @see RFC 1035 - DNS Protocol Specification
 */

/** Supported DNS record types for queries */
const DNS_RECORD_TYPES_ARRAY = [
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

export const DNS_RECORD_TYPES = DNS_RECORD_TYPES_ARRAY;

/** Supported DNS record types */
export type DnsRecordType = (typeof DNS_RECORD_TYPES)[number];

/**
 * DNS query response status codes.
 * - SUCCESS: Query successful, records returned
 * - NXDOMAIN: Domain name does not exist
 * - SERVFAIL: DNS server error (server failed internally)
 * - TIMEOUT: Query timed out (no response received)
 * - REFUSED: Server refused the query (policy or permissions)
 * - NETWORK_ERROR: Cannot reach DNS server (network unavailable)
 */
export type DnsLookupStatus =
  | 'SUCCESS'
  | 'NXDOMAIN'
  | 'SERVFAIL'
  | 'TIMEOUT'
  | 'REFUSED'
  | 'NETWORK_ERROR';

/**
 * Single DNS record returned from a lookup.
 *
 * @description Represents a DNS resource record with fields relevant to the record type:
 * - A/AAAA: IPv4/IPv6 address
 * - MX: Mail server (priority, address)
 * - SRV: Service record (priority, weight, port, target)
 * - TXT: Text data (may contain multiple strings)
 * - CNAME/NS/PTR: Target domain name
 * - SOA: Zone authority info
 */
export interface DnsRecord {
  /** Record domain name */
  name: string;
  /** DNS record type (A, AAAA, MX, etc.) */
  type: DnsRecordType;
  /** Time-to-live in seconds; how long to cache */
  ttl: number;
  /** Record data (format depends on type) */
  data: string;
  /** Priority for MX and SRV records (lower is higher priority) */
  priority?: number;
  /** Weight for SRV records (relative weight for load balancing) */
  weight?: number;
  /** Port for SRV records */
  port?: number;
}

/**
 * Result of a DNS lookup operation.
 *
 * @description Complete information about a DNS query result including:
 * - What was queried (hostname, record type)
 * - Query execution details (server, response time, authority)
 * - Result data (records or error message)
 * - Timing and timestamp for auditing
 */
export interface DnsLookupResult {
  /** Hostname or IP that was queried */
  hostname: string;
  /** Type of DNS record requested */
  recordType: DnsRecordType;
  /** Query status (success or error code) */
  status: DnsLookupStatus;
  /** Array of DNS records returned (empty if error or no records) */
  records: DnsRecord[];
  /** DNS server that was queried (IP address) */
  server: string;
  /** Time taken for the query in milliseconds */
  queryTime: number;
  /** Whether the response came from an authoritative source */
  authoritative: boolean;
  /** Error message if status is not SUCCESS (null if successful) */
  error: string | null;
  /** ISO 8601 timestamp when query was executed */
  timestamp: string;
}

/**
 * DNS server configuration on the router.
 *
 * @description Represents a DNS server configured in the router's system.
 * Used to build the list of servers for multi-server comparison lookups.
 */
export interface DnsServer {
  /** IPv4 or IPv6 address of the DNS server */
  address: string;
  /** True if this is the primary/preferred DNS server */
  isPrimary: boolean;
  /** True if this is the secondary/fallback DNS server */
  isSecondary: boolean;
}
