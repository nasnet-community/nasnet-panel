/**
 * Storybook stories for DnsServerComparison
 *
 * Covers: empty state, single server, multiple servers (fastest badge),
 * error state, discrepancy warning, and mixed results.
 */

import { DnsServerComparison } from './DnsServerComparison';

import type { DnsLookupResult } from './DnsLookupTool.types';
import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Mock data helpers
// ---------------------------------------------------------------------------

const aRecord = (data: string) => ({
  name: 'example.com.',
  type: 'A' as const,
  ttl: 300,
  data,
});

const successResult = (
  server: string,
  queryTime: number,
  records: DnsLookupResult['records'] = [aRecord('93.184.216.34')]
): DnsLookupResult => ({
  hostname: 'example.com',
  recordType: 'A',
  status: 'SUCCESS',
  records,
  server,
  queryTime,
  authoritative: false,
  error: null,
  timestamp: new Date().toISOString(),
});

const errorResult = (
  server: string,
  status: DnsLookupResult['status'],
  error: string
): DnsLookupResult => ({
  hostname: 'example.com',
  recordType: 'A',
  status,
  records: [],
  server,
  queryTime: 5000,
  authoritative: false,
  error,
  timestamp: new Date().toISOString(),
});

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof DnsServerComparison> = {
  title: 'Features/Diagnostics/DnsServerComparison',
  component: DnsServerComparison,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Side-by-side comparison of DNS lookup results from multiple servers. ' +
          'Highlights the fastest server with a badge and warns when record counts differ.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DnsServerComparison>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Empty: Story = {
  name: 'Empty State',
  args: {
    results: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'Rendered when no results are available yet.',
      },
    },
  },
};

export const SingleServer: Story = {
  name: 'Single Server',
  args: {
    results: [successResult('8.8.8.8', 24)],
  },
  parameters: {
    docs: {
      description: {
        story: 'A single DNS server result — no "Fastest" badge is shown because there is nothing to compare.',
      },
    },
  },
};

export const TwoServersComparison: Story = {
  name: 'Two Servers — Fastest Badge',
  args: {
    results: [
      successResult('8.8.8.8', 24),
      successResult('1.1.1.1', 11),
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Cloudflare (1.1.1.1) is faster; it receives the "Fastest" badge and a green ring.',
      },
    },
  },
};

export const MultipleServers: Story = {
  name: 'Four Servers',
  args: {
    results: [
      successResult('8.8.8.8', 24),
      successResult('1.1.1.1', 11),
      successResult('9.9.9.9', 38),
      successResult('208.67.222.222', 45),
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Four public DNS resolvers compared side-by-side in a 2-column grid.',
      },
    },
  },
};

export const WithErrors: Story = {
  name: 'Mixed — Success and Errors',
  args: {
    results: [
      successResult('8.8.8.8', 24),
      errorResult('1.1.1.1', 'TIMEOUT', 'Connection timed out after 5000ms'),
      successResult('9.9.9.9', 38),
      errorResult('208.67.222.222', 'REFUSED', 'Query refused by server'),
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Two servers fail — they render with reduced opacity and an error badge.',
      },
    },
  },
};

export const DiscrepancyWarning: Story = {
  name: 'Discrepancy Warning',
  args: {
    results: [
      successResult('8.8.8.8', 18, [aRecord('93.184.216.34')]),
      successResult('1.1.1.1', 12, [
        aRecord('93.184.216.34'),
        aRecord('93.184.216.35'), // extra record → discrepancy
      ]),
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Servers return different numbers of records. The summary section shows a discrepancy warning.',
      },
    },
  },
};
