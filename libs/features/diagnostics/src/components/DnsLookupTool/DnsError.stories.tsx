/**
 * Storybook stories for DnsError
 *
 * Demonstrates all DNS error status variants supported by the DnsError component:
 * NXDOMAIN, SERVFAIL, TIMEOUT, REFUSED, and NETWORK_ERROR.
 * Each story also verifies that query details (hostname, record type, server, status)
 * are shown in the lower metadata panel.
 */

import { DnsError } from './DnsError';

import type { DnsLookupResult } from './DnsLookupTool.types';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof DnsError> = {
  title: 'Features/Diagnostics/DnsError',
  component: DnsError,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Displays DNS lookup errors with user-friendly messages, contextual icons, and actionable suggestions tailored to each error type (NXDOMAIN, SERVFAIL, TIMEOUT, REFUSED, NETWORK_ERROR). Also renders query metadata for debugging.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DnsError>;

// ─── Base result factory ──────────────────────────────────────────────────────

function makeErrorResult(overrides: Partial<DnsLookupResult>): DnsLookupResult {
  return {
    hostname: 'example.com',
    recordType: 'A',
    status: 'NXDOMAIN',
    records: [],
    server: '8.8.8.8',
    queryTime: 52,
    authoritative: false,
    error: null,
    timestamp: '2024-01-15T10:30:00Z',
    ...overrides,
  };
}

// ─── Stories ─────────────────────────────────────────────────────────────────

/**
 * NXDOMAIN — Domain Does Not Exist
 *
 * The most common DNS error. The domain is not registered or was misspelled.
 * Suggestion: double-check spelling or verify registration.
 */
export const NXDOMAIN: Story = {
  args: {
    result: makeErrorResult({
      hostname: 'this-domain-does-not-exist-12345.com',
      status: 'NXDOMAIN',
      error: 'Domain name does not exist (NXDOMAIN)',
    }),
  },
};

/**
 * SERVFAIL — Server Failure
 *
 * The DNS server encountered an internal error while processing the query.
 * Suggestion: retry or switch to a different DNS server.
 */
export const SERVFAIL: Story = {
  args: {
    result: makeErrorResult({
      hostname: 'example.com',
      status: 'SERVFAIL',
      error: 'DNS server returned SERVFAIL',
      server: '192.168.1.1',
    }),
  },
  parameters: {
    docs: {
      description: {
        story:
          'SERVFAIL indicates the upstream resolver failed to complete the query. Often transient — retrying or changing servers resolves it.',
      },
    },
  },
};

/**
 * TIMEOUT — No Response Within Limit
 *
 * The DNS server did not respond within the configured timeout window.
 * Suggestion: increase the timeout or try a different server.
 */
export const Timeout: Story = {
  args: {
    result: makeErrorResult({
      hostname: 'slowdns.example.net',
      status: 'TIMEOUT',
      error: 'DNS query timed out after 5 seconds',
      server: '203.0.113.99',
      queryTime: 5000,
    }),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Timeout errors show the clock icon and advise the user to increase the timeout value or select a faster server.',
      },
    },
  },
};

/**
 * REFUSED — Query Rejected by Server
 *
 * The DNS server actively refused to answer the query (e.g., due to access
 * control lists or policy restrictions).
 * Suggestion: the server may have query restrictions configured.
 */
export const Refused: Story = {
  args: {
    result: makeErrorResult({
      hostname: 'internal.corp.example',
      recordType: 'A',
      status: 'REFUSED',
      error: 'DNS server refused the query',
      server: '10.0.0.53',
    }),
  },
  parameters: {
    docs: {
      description: {
        story:
          'REFUSED is typically returned by servers with ACLs that block external queries. Common when querying a corporate internal DNS from an unauthorized source.',
      },
    },
  },
};

/**
 * NETWORK_ERROR — No Connectivity to DNS Server
 *
 * The router could not reach the DNS server at the network layer.
 * Suggestion: check router connectivity and network configuration.
 */
export const NetworkError: Story = {
  args: {
    result: makeErrorResult({
      hostname: 'google.com',
      status: 'NETWORK_ERROR',
      error: 'Unable to reach DNS server: connection refused',
      server: '8.8.8.8',
    }),
  },
  parameters: {
    docs: {
      description: {
        story:
          'NETWORK_ERROR means the router could not establish a UDP/TCP connection to the DNS server. Likely a WAN or routing issue.',
      },
    },
  },
};

/**
 * MX Record NXDOMAIN
 *
 * Error state for a non-A record type to confirm query metadata
 * (hostname, record type, server) renders correctly for all record types.
 */
export const MXRecordNXDOMAIN: Story = {
  args: {
    result: makeErrorResult({
      hostname: 'nonexistent-mail-domain.example',
      recordType: 'MX',
      status: 'NXDOMAIN',
      error: 'Domain name does not exist (NXDOMAIN)',
      server: '1.1.1.1',
    }),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Verifies that the Query Details panel renders the correct record type ("MX") and server when the lookup type differs from the default "A".',
      },
    },
  },
};
