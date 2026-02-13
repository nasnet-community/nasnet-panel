import { gql } from '@apollo/client';

/**
 * GraphQL documents for DNS diagnostics
 * NAS-6.12: DNS Cache & Diagnostics
 */

// =============================================================================
// Queries
// =============================================================================

/**
 * Get DNS cache statistics including entries, size, hit rate, and top domains
 */
export const GET_DNS_CACHE_STATS = gql`
  query GetDnsCacheStats($deviceId: String!) {
    dnsCacheStats(deviceId: $deviceId) {
      totalEntries
      cacheUsedBytes
      cacheMaxBytes
      cacheUsagePercent
      hitRatePercent
      topDomains {
        domain
        queryCount
        lastQueried
      }
      timestamp
    }
  }
`;

/**
 * Run DNS server benchmark against all configured DNS servers
 */
export const RUN_DNS_BENCHMARK = gql`
  query RunDnsBenchmark($deviceId: String!) {
    dnsBenchmark(deviceId: $deviceId) {
      testHostname
      serverResults {
        server
        responseTimeMs
        status
        success
        error
      }
      fastestServer {
        server
        responseTimeMs
        status
        success
      }
      timestamp
      totalTimeMs
    }
  }
`;

// =============================================================================
// Mutations
// =============================================================================

/**
 * Perform DNS lookup with specified record type
 */
export const RUN_DNS_LOOKUP = gql`
  mutation RunDnsLookup($input: DnsLookupInput!) {
    runDnsLookup(input: $input) {
      hostname
      recordType
      status
      records {
        name
        type
        ttl
        data
        priority
        weight
        port
      }
      server
      queryTime
      authoritative
      error
      timestamp
    }
  }
`;

/**
 * Flush DNS cache and return before/after statistics
 */
export const FLUSH_DNS_CACHE = gql`
  mutation FlushDnsCache($deviceId: String!) {
    flushDnsCache(deviceId: $deviceId) {
      success
      entriesRemoved
      beforeStats {
        totalEntries
        cacheUsedBytes
        cacheMaxBytes
        cacheUsagePercent
      }
      afterStats {
        totalEntries
        cacheUsedBytes
        cacheMaxBytes
        cacheUsagePercent
      }
      message
      timestamp
    }
  }
`;
