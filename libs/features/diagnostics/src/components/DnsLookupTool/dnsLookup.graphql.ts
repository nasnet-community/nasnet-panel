/**
 * DNS Lookup Tool - GraphQL Operations
 *
 * GraphQL mutations and queries for DNS lookup functionality including
 * running DNS lookups and fetching configured DNS servers.
 *
 * @see Story NAS-5.9 - Implement DNS Lookup Tool - Task 5.9.3
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
