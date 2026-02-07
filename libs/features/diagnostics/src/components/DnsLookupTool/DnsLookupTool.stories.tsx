/**
 * DNS Lookup Tool - Storybook Stories
 *
 * Comprehensive stories covering all DNS lookup states including:
 * - Idle state
 * - Loading state
 * - Various record types (A, MX, TXT, etc.)
 * - Error states (NXDOMAIN, TIMEOUT)
 * - Server comparison
 * - Mobile layout
 *
 * @see Story NAS-5.9 - Implement DNS Lookup Tool - Task 5.9.12
 */

import type { Meta, StoryObj } from '@storybook/react';
import { MockedProvider } from '@apollo/client/testing';
import { DnsLookupTool } from './DnsLookupTool';
import { GET_DNS_SERVERS, RUN_DNS_LOOKUP } from './dnsLookup.graphql';

const meta: Meta<typeof DnsLookupTool> = {
  title: 'Features/Diagnostics/DnsLookupTool',
  component: DnsLookupTool,
  decorators: [
    (Story) => (
      <div className="p-4 max-w-6xl">
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DnsLookupTool>;

const mockDnsServers = {
  dnsServers: {
    servers: [
      { address: '8.8.8.8', isPrimary: true, isSecondary: false },
      { address: '1.1.1.1', isPrimary: false, isSecondary: true },
    ],
    primary: '8.8.8.8',
    secondary: '1.1.1.1',
  },
};

/**
 * Default idle state showing empty form ready for input
 */
export const Idle: Story = {
  args: {
    deviceId: 'test-device-123',
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={[
          {
            request: {
              query: GET_DNS_SERVERS,
              variables: { deviceId: 'test-device-123' },
            },
            result: { data: mockDnsServers },
          },
        ]}
      >
        <Story />
      </MockedProvider>
    ),
  ],
};

/**
 * Loading state during DNS query execution
 */
export const Loading: Story = {
  args: {
    deviceId: 'test-device-123',
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={[
          {
            request: {
              query: GET_DNS_SERVERS,
              variables: { deviceId: 'test-device-123' },
            },
            result: { data: mockDnsServers },
          },
          {
            request: {
              query: RUN_DNS_LOOKUP,
              variables: {
                input: {
                  deviceId: 'test-device-123',
                  hostname: 'google.com',
                  recordType: 'A',
                },
              },
            },
            delay: Infinity, // Never resolve to show loading state
          },
        ]}
      >
        <Story />
      </MockedProvider>
    ),
  ],
};

/**
 * Successful A record lookup showing single IPv4 address
 */
export const ARecord: Story = {
  args: {
    deviceId: 'test-device-123',
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={[
          {
            request: {
              query: GET_DNS_SERVERS,
              variables: { deviceId: 'test-device-123' },
            },
            result: { data: mockDnsServers },
          },
          {
            request: {
              query: RUN_DNS_LOOKUP,
            },
            result: {
              data: {
                runDnsLookup: {
                  hostname: 'google.com',
                  recordType: 'A',
                  status: 'SUCCESS',
                  records: [
                    {
                      name: 'google.com',
                      type: 'A',
                      ttl: 300,
                      data: '142.250.185.46',
                      priority: null,
                      weight: null,
                      port: null,
                    },
                  ],
                  server: '8.8.8.8',
                  queryTime: 42,
                  authoritative: false,
                  error: null,
                  timestamp: '2024-01-15T10:30:00Z',
                },
              },
            },
          },
        ]}
      >
        <Story />
      </MockedProvider>
    ),
  ],
};

/**
 * Multiple A records showing load-balanced service
 */
export const MultipleARecords: Story = {
  args: {
    deviceId: 'test-device-123',
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={[
          {
            request: {
              query: GET_DNS_SERVERS,
              variables: { deviceId: 'test-device-123' },
            },
            result: { data: mockDnsServers },
          },
          {
            request: {
              query: RUN_DNS_LOOKUP,
            },
            result: {
              data: {
                runDnsLookup: {
                  hostname: 'google.com',
                  recordType: 'A',
                  status: 'SUCCESS',
                  records: [
                    {
                      name: 'google.com',
                      type: 'A',
                      ttl: 300,
                      data: '142.250.185.46',
                      priority: null,
                      weight: null,
                      port: null,
                    },
                    {
                      name: 'google.com',
                      type: 'A',
                      ttl: 300,
                      data: '142.250.185.78',
                      priority: null,
                      weight: null,
                      port: null,
                    },
                    {
                      name: 'google.com',
                      type: 'A',
                      ttl: 300,
                      data: '142.250.185.110',
                      priority: null,
                      weight: null,
                      port: null,
                    },
                  ],
                  server: '8.8.8.8',
                  queryTime: 38,
                  authoritative: false,
                  error: null,
                  timestamp: '2024-01-15T10:30:00Z',
                },
              },
            },
          },
        ]}
      >
        <Story />
      </MockedProvider>
    ),
  ],
};

/**
 * MX records showing mail server configuration with priority
 */
export const MXRecords: Story = {
  args: {
    deviceId: 'test-device-123',
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={[
          {
            request: {
              query: GET_DNS_SERVERS,
              variables: { deviceId: 'test-device-123' },
            },
            result: { data: mockDnsServers },
          },
          {
            request: {
              query: RUN_DNS_LOOKUP,
            },
            result: {
              data: {
                runDnsLookup: {
                  hostname: 'gmail.com',
                  recordType: 'MX',
                  status: 'SUCCESS',
                  records: [
                    {
                      name: 'gmail.com',
                      type: 'MX',
                      ttl: 3600,
                      data: 'gmail-smtp-in.l.google.com',
                      priority: 5,
                      weight: null,
                      port: null,
                    },
                    {
                      name: 'gmail.com',
                      type: 'MX',
                      ttl: 3600,
                      data: 'alt1.gmail-smtp-in.l.google.com',
                      priority: 10,
                      weight: null,
                      port: null,
                    },
                    {
                      name: 'gmail.com',
                      type: 'MX',
                      ttl: 3600,
                      data: 'alt2.gmail-smtp-in.l.google.com',
                      priority: 20,
                      weight: null,
                      port: null,
                    },
                  ],
                  server: '8.8.8.8',
                  queryTime: 125,
                  authoritative: false,
                  error: null,
                  timestamp: '2024-01-15T10:30:00Z',
                },
              },
            },
          },
        ]}
      >
        <Story />
      </MockedProvider>
    ),
  ],
};

/**
 * TXT record showing SPF configuration
 */
export const TXTRecord: Story = {
  args: {
    deviceId: 'test-device-123',
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={[
          {
            request: {
              query: GET_DNS_SERVERS,
              variables: { deviceId: 'test-device-123' },
            },
            result: { data: mockDnsServers },
          },
          {
            request: {
              query: RUN_DNS_LOOKUP,
            },
            result: {
              data: {
                runDnsLookup: {
                  hostname: 'google.com',
                  recordType: 'TXT',
                  status: 'SUCCESS',
                  records: [
                    {
                      name: 'google.com',
                      type: 'TXT',
                      ttl: 3600,
                      data: 'v=spf1 include:_spf.google.com ~all',
                      priority: null,
                      weight: null,
                      port: null,
                    },
                  ],
                  server: '8.8.8.8',
                  queryTime: 89,
                  authoritative: false,
                  error: null,
                  timestamp: '2024-01-15T10:30:00Z',
                },
              },
            },
          },
        ]}
      >
        <Story />
      </MockedProvider>
    ),
  ],
};

/**
 * NXDOMAIN error - domain does not exist
 */
export const NXDOMAIN: Story = {
  args: {
    deviceId: 'test-device-123',
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={[
          {
            request: {
              query: GET_DNS_SERVERS,
              variables: { deviceId: 'test-device-123' },
            },
            result: { data: mockDnsServers },
          },
          {
            request: {
              query: RUN_DNS_LOOKUP,
            },
            result: {
              data: {
                runDnsLookup: {
                  hostname: 'this-domain-does-not-exist-12345.com',
                  recordType: 'A',
                  status: 'NXDOMAIN',
                  records: [],
                  server: '8.8.8.8',
                  queryTime: 52,
                  authoritative: false,
                  error: 'Domain name does not exist (NXDOMAIN)',
                  timestamp: '2024-01-15T10:30:00Z',
                },
              },
            },
          },
        ]}
      >
        <Story />
      </MockedProvider>
    ),
  ],
};

/**
 * Timeout error - DNS server not responding
 */
export const Timeout: Story = {
  args: {
    deviceId: 'test-device-123',
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={[
          {
            request: {
              query: GET_DNS_SERVERS,
              variables: { deviceId: 'test-device-123' },
            },
            result: { data: mockDnsServers },
          },
          {
            request: {
              query: RUN_DNS_LOOKUP,
            },
            result: {
              data: {
                runDnsLookup: {
                  hostname: 'example.com',
                  recordType: 'A',
                  status: 'TIMEOUT',
                  records: [],
                  server: '8.8.8.8',
                  queryTime: 5000,
                  authoritative: false,
                  error: 'DNS query timed out after 5 seconds',
                  timestamp: '2024-01-15T10:30:00Z',
                },
              },
            },
          },
        ]}
      >
        <Story />
      </MockedProvider>
    ),
  ],
};

/**
 * Server comparison showing side-by-side results from multiple DNS servers
 */
export const ServerComparison: Story = {
  args: {
    deviceId: 'test-device-123',
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={[
          {
            request: {
              query: GET_DNS_SERVERS,
              variables: { deviceId: 'test-device-123' },
            },
            result: { data: mockDnsServers },
          },
          // Mock for first server (8.8.8.8)
          {
            request: {
              query: RUN_DNS_LOOKUP,
              variables: {
                input: {
                  deviceId: 'test-device-123',
                  hostname: 'google.com',
                  recordType: 'A',
                  server: '8.8.8.8',
                },
              },
            },
            result: {
              data: {
                runDnsLookup: {
                  hostname: 'google.com',
                  recordType: 'A',
                  status: 'SUCCESS',
                  records: [
                    {
                      name: 'google.com',
                      type: 'A',
                      ttl: 300,
                      data: '142.250.185.46',
                      priority: null,
                      weight: null,
                      port: null,
                    },
                  ],
                  server: '8.8.8.8',
                  queryTime: 42,
                  authoritative: false,
                  error: null,
                  timestamp: '2024-01-15T10:30:00Z',
                },
              },
            },
          },
          // Mock for second server (1.1.1.1)
          {
            request: {
              query: RUN_DNS_LOOKUP,
              variables: {
                input: {
                  deviceId: 'test-device-123',
                  hostname: 'google.com',
                  recordType: 'A',
                  server: '1.1.1.1',
                },
              },
            },
            result: {
              data: {
                runDnsLookup: {
                  hostname: 'google.com',
                  recordType: 'A',
                  status: 'SUCCESS',
                  records: [
                    {
                      name: 'google.com',
                      type: 'A',
                      ttl: 300,
                      data: '142.250.185.46',
                      priority: null,
                      weight: null,
                      port: null,
                    },
                  ],
                  server: '1.1.1.1',
                  queryTime: 65,
                  authoritative: false,
                  error: null,
                  timestamp: '2024-01-15T10:30:01Z',
                },
              },
            },
          },
        ]}
      >
        <Story />
      </MockedProvider>
    ),
  ],
};

/**
 * Mobile layout optimized for touch devices
 */
export const MobileLayout: Story = {
  args: {
    deviceId: 'test-device-123',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={[
          {
            request: {
              query: GET_DNS_SERVERS,
              variables: { deviceId: 'test-device-123' },
            },
            result: { data: mockDnsServers },
          },
        ]}
      >
        <Story />
      </MockedProvider>
    ),
  ],
};
