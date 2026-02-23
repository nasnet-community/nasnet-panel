/**
 * DNS Lookup Tool - GraphQL Operations
 *
 * GraphQL mutations and queries for DNS lookup functionality including
 * running DNS lookups and fetching configured DNS servers.
 *
 * @description Provides:
 * - RUN_DNS_LOOKUP mutation: Execute a DNS query against a specified server or the router's primary DNS
 * - GET_DNS_SERVERS query: Retrieve list of configured DNS servers on the router
 *
 * @see Story NAS-5.9 - Implement DNS Lookup Tool - Task 5.9.3
 * @see api-contracts.md GraphQL Query Patterns
 * @example
 * ```tsx
 * const { data } = await client.mutate({
 *   mutation: RUN_DNS_LOOKUP,
 *   variables: {
 *     input: {
 *       deviceId: 'router-1',
 *       hostname: 'example.com',
 *       recordType: 'A',
 *       server: '8.8.8.8',
 *       timeout: 2000
 *     }
 *   }
 * });
 * ```
 */

import { gql } from '@apollo/client';

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

export const GET_DNS_SERVERS = gql`
  query DnsServers($deviceId: ID!) {
    dnsServers(deviceId: $deviceId) {
      servers {
        address
        isPrimary
        isSecondary
      }
      primary
      secondary
    }
  }
`;
