/**
 * Storybook stories for DnsResults
 *
 * Demonstrates the DNS results table component across all major
 * record types, authority levels, and query-time color states.
 */

import { DnsResults } from './DnsResults';

import type { DnsLookupResult } from './DnsLookupTool.types';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof DnsResults> = {
  title: 'Features/Diagnostics/DnsResults',
  component: DnsResults,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Displays DNS lookup results in an accessible table. Includes query metadata (server, query time, authority flag) and per-record copy buttons. MX and SRV records are sorted by priority.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DnsResults>;

// ─── Base result factory ──────────────────────────────────────────────────────

function makeResult(overrides: Partial<DnsLookupResult>): DnsLookupResult {
  return {
    hostname: 'example.com',
    recordType: 'A',
    status: 'SUCCESS',
    records: [],
    server: '8.8.8.8',
    queryTime: 42,
    authoritative: false,
    error: null,
    timestamp: '2024-01-15T10:30:00Z',
    ...overrides,
  };
}

// ─── Stories ─────────────────────────────────────────────────────────────────

/**
 * A Record — Single IPv4 Address
 *
 * The simplest and most common DNS query. Shows one A record with a fast
 * query time (green) and no authority badge.
 */
export const ARecord: Story = {
  args: {
    result: makeResult({
      hostname: 'google.com',
      recordType: 'A',
      queryTime: 42,
      records: [
        { name: 'google.com', type: 'A', ttl: 300, data: '142.250.185.46' },
      ],
    }),
  },
};

/**
 * Multiple A Records (Load Balanced)
 *
 * A hostname that resolves to several IPs, typical for large-scale services.
 * Demonstrates how multiple rows render in the table.
 */
export const MultipleARecords: Story = {
  args: {
    result: makeResult({
      hostname: 'google.com',
      recordType: 'A',
      queryTime: 38,
      records: [
        { name: 'google.com', type: 'A', ttl: 300, data: '142.250.185.46' },
        { name: 'google.com', type: 'A', ttl: 300, data: '142.250.185.78' },
        { name: 'google.com', type: 'A', ttl: 300, data: '142.250.185.110' },
        { name: 'google.com', type: 'A', ttl: 300, data: '142.250.185.142' },
      ],
    }),
  },
  parameters: {
    docs: {
      description: {
        story: 'Four A records for a load-balanced domain. Record count in the footer updates accordingly.',
      },
    },
  },
};

/**
 * MX Records (Sorted by Priority)
 *
 * Mail exchange records automatically sorted by ascending priority.
 * Demonstrates the priority-sort behaviour for MX types.
 */
export const MXRecords: Story = {
  args: {
    result: makeResult({
      hostname: 'gmail.com',
      recordType: 'MX',
      queryTime: 125,
      records: [
        // Intentionally out of priority order to verify sorting
        { name: 'gmail.com', type: 'MX', ttl: 3600, data: 'alt2.gmail-smtp-in.l.google.com', priority: 20 },
        { name: 'gmail.com', type: 'MX', ttl: 3600, data: 'gmail-smtp-in.l.google.com', priority: 5 },
        { name: 'gmail.com', type: 'MX', ttl: 3600, data: 'alt1.gmail-smtp-in.l.google.com', priority: 10 },
        { name: 'gmail.com', type: 'MX', ttl: 3600, data: 'alt3.gmail-smtp-in.l.google.com', priority: 30 },
        { name: 'gmail.com', type: 'MX', ttl: 3600, data: 'alt4.gmail-smtp-in.l.google.com', priority: 40 },
      ],
    }),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Records are passed in random priority order to verify that sortRecordsByPriority() sorts them ascending (5 → 10 → 20 → 30 → 40). Query time of 125ms renders in amber.',
      },
    },
  },
};

/**
 * TXT Record (SPF)
 *
 * A TXT record containing an SPF policy string — common DNS verification use case.
 */
export const TXTRecord: Story = {
  args: {
    result: makeResult({
      hostname: 'google.com',
      recordType: 'TXT',
      queryTime: 89,
      records: [
        {
          name: 'google.com',
          type: 'TXT',
          ttl: 3600,
          data: 'v=spf1 include:_spf.google.com ~all',
        },
        {
          name: 'google.com',
          type: 'TXT',
          ttl: 3600,
          data: 'google-site-verification=wD8N7i1JTNTkezJ49swvWW48f8_9xveREV4oB-0Hf5o',
        },
      ],
    }),
  },
};

/**
 * Authoritative Response
 *
 * Shows the "Authoritative" badge in the metadata header when the responding
 * server is the authoritative nameserver for the domain.
 */
export const AuthoritativeResponse: Story = {
  args: {
    result: makeResult({
      hostname: 'ns1.example.com',
      recordType: 'A',
      queryTime: 12,
      authoritative: true,
      server: '192.168.1.1',
      records: [
        { name: 'ns1.example.com', type: 'A', ttl: 86400, data: '203.0.113.10' },
      ],
    }),
  },
  parameters: {
    docs: {
      description: {
        story:
          'The "Authoritative" badge appears when result.authoritative === true. Fast query time of 12ms renders in green.',
      },
    },
  },
};

/**
 * Slow Query Time
 *
 * Query time of 350ms triggers the error color (red) in the metadata header,
 * alerting the user that the DNS server is responding slowly.
 */
export const SlowQueryTime: Story = {
  args: {
    result: makeResult({
      hostname: 'example.com',
      recordType: 'A',
      queryTime: 350,
      server: '192.168.50.1',
      records: [
        { name: 'example.com', type: 'A', ttl: 300, data: '93.184.216.34' },
      ],
    }),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Query times >= 200ms render in red. This story demonstrates the slow-DNS scenario where a local resolver is underperforming.',
      },
    },
  },
};

/**
 * No Records Found
 *
 * A successful response that returned zero records (rare but valid).
 * Shows the "No records found" empty state inside the table area.
 */
export const NoRecordsFound: Story = {
  args: {
    result: makeResult({
      hostname: 'empty.example.com',
      recordType: 'AAAA',
      queryTime: 31,
      records: [],
    }),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Status is SUCCESS but records array is empty — the component renders an empty-state message rather than a table.',
      },
    },
  },
};
