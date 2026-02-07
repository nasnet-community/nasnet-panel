/**
 * DNS Lookup Tool - Hook Tests
 *
 * Unit tests for useDnsLookup hook covering successful lookups,
 * error handling, multi-server comparison, and state management.
 *
 * @see Story NAS-5.9 - Implement DNS Lookup Tool - Task 5.9.10
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { useDnsLookup } from './useDnsLookup';
import { RUN_DNS_LOOKUP, GET_DNS_SERVERS } from './dnsLookup.graphql';
import type { DnsLookupFormValues } from './dnsLookup.schema';
import type { ReactNode } from 'react';

// Mock DNS servers response
const mockDnsServers = {
  servers: [
    { address: '8.8.8.8', isPrimary: true, isSecondary: false },
    { address: '1.1.1.1', isPrimary: false, isSecondary: true },
  ],
  primary: '8.8.8.8',
  secondary: '1.1.1.1',
};

// Mock successful A record lookup
const mockARecordResult = {
  hostname: 'google.com',
  recordType: 'A',
  status: 'SUCCESS',
  records: [
    {
      name: 'google.com',
      type: 'A',
      ttl: 300,
      data: '142.250.80.46',
    },
  ],
  server: '8.8.8.8',
  queryTime: 15,
  authoritative: false,
  error: null,
  timestamp: '2026-02-05T10:00:00Z',
};

// Mock MX records lookup
const mockMXRecordsResult = {
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
    },
    {
      name: 'gmail.com',
      type: 'MX',
      ttl: 3600,
      data: 'alt1.gmail-smtp-in.l.google.com',
      priority: 10,
    },
  ],
  server: '8.8.8.8',
  queryTime: 25,
  authoritative: true,
  error: null,
  timestamp: '2026-02-05T10:00:00Z',
};

// Mock NXDOMAIN error
const mockNXDOMAINResult = {
  hostname: 'thisdomaindoesnotexist12345.com',
  recordType: 'A',
  status: 'NXDOMAIN',
  records: [],
  server: '8.8.8.8',
  queryTime: 10,
  authoritative: false,
  error: 'Domain does not exist',
  timestamp: '2026-02-05T10:00:00Z',
};

// Mock TIMEOUT error
const mockTimeoutResult = {
  hostname: 'slow-domain.com',
  recordType: 'A',
  status: 'TIMEOUT',
  records: [],
  server: '8.8.8.8',
  queryTime: 2000,
  authoritative: false,
  error: 'Query timed out',
  timestamp: '2026-02-05T10:00:00Z',
};

describe('useDnsLookup', () => {
  const deviceId = 'test-device-123';
  const onSuccess = vi.fn();
  const onError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with correct default state', () => {
    const mocks = [
      {
        request: {
          query: GET_DNS_SERVERS,
          variables: { deviceId },
        },
        result: {
          data: {
            dnsServers: mockDnsServers,
          },
        },
      },
    ];

    const wrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider mocks={mocks}>{children}</MockedProvider>
    );

    const { result } = renderHook(() => useDnsLookup({ deviceId, onSuccess, onError }), {
      wrapper,
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.result).toBeNull();
    expect(result.current.comparisonResults).toEqual([]);
  });

  it('should successfully perform A record lookup', async () => {
    const formValues: DnsLookupFormValues = {
      hostname: 'google.com',
      recordType: 'A',
      timeout: 2000,
    };

    const mocks = [
      {
        request: {
          query: GET_DNS_SERVERS,
          variables: { deviceId },
        },
        result: {
          data: {
            dnsServers: mockDnsServers,
          },
        },
      },
      {
        request: {
          query: RUN_DNS_LOOKUP,
          variables: {
            input: {
              deviceId,
              hostname: 'google.com',
              recordType: 'A',
              server: undefined,
              timeout: 2000,
            },
          },
        },
        result: {
          data: {
            runDnsLookup: mockARecordResult,
          },
        },
      },
    ];

    const wrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider mocks={mocks}>{children}</MockedProvider>
    );

    const { result } = renderHook(() => useDnsLookup({ deviceId, onSuccess, onError }), {
      wrapper,
    });

    act(() => {
      result.current.lookup(formValues);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.result).toEqual(mockARecordResult);
    expect(result.current.result?.records).toHaveLength(1);
    expect(onSuccess).toHaveBeenCalledWith(mockARecordResult);
    expect(onError).not.toHaveBeenCalled();
  });

  it('should successfully perform MX record lookup and sort by priority', async () => {
    const formValues: DnsLookupFormValues = {
      hostname: 'gmail.com',
      recordType: 'MX',
      timeout: 2000,
    };

    const mocks = [
      {
        request: {
          query: GET_DNS_SERVERS,
          variables: { deviceId },
        },
        result: {
          data: {
            dnsServers: mockDnsServers,
          },
        },
      },
      {
        request: {
          query: RUN_DNS_LOOKUP,
          variables: {
            input: {
              deviceId,
              hostname: 'gmail.com',
              recordType: 'MX',
              server: undefined,
              timeout: 2000,
            },
          },
        },
        result: {
          data: {
            runDnsLookup: mockMXRecordsResult,
          },
        },
      },
    ];

    const wrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider mocks={mocks}>{children}</MockedProvider>
    );

    const { result } = renderHook(() => useDnsLookup({ deviceId, onSuccess, onError }), {
      wrapper,
    });

    act(() => {
      result.current.lookup(formValues);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.result).toEqual(mockMXRecordsResult);
    expect(result.current.result?.records).toHaveLength(2);
    expect(result.current.result?.records[0].priority).toBe(5);
    expect(result.current.result?.records[1].priority).toBe(10);
    expect(onSuccess).toHaveBeenCalledWith(mockMXRecordsResult);
  });

  it('should handle NXDOMAIN error correctly', async () => {
    const formValues: DnsLookupFormValues = {
      hostname: 'thisdomaindoesnotexist12345.com',
      recordType: 'A',
      timeout: 2000,
    };

    const mocks = [
      {
        request: {
          query: GET_DNS_SERVERS,
          variables: { deviceId },
        },
        result: {
          data: {
            dnsServers: mockDnsServers,
          },
        },
      },
      {
        request: {
          query: RUN_DNS_LOOKUP,
          variables: {
            input: {
              deviceId,
              hostname: 'thisdomaindoesnotexist12345.com',
              recordType: 'A',
              server: undefined,
              timeout: 2000,
            },
          },
        },
        result: {
          data: {
            runDnsLookup: mockNXDOMAINResult,
          },
        },
      },
    ];

    const wrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider mocks={mocks}>{children}</MockedProvider>
    );

    const { result } = renderHook(() => useDnsLookup({ deviceId, onSuccess, onError }), {
      wrapper,
    });

    act(() => {
      result.current.lookup(formValues);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.result).toEqual(mockNXDOMAINResult);
    expect(result.current.result?.status).toBe('NXDOMAIN');
    expect(onError).toHaveBeenCalledWith('Domain does not exist');
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('should handle TIMEOUT error correctly', async () => {
    const formValues: DnsLookupFormValues = {
      hostname: 'slow-domain.com',
      recordType: 'A',
      timeout: 2000,
    };

    const mocks = [
      {
        request: {
          query: GET_DNS_SERVERS,
          variables: { deviceId },
        },
        result: {
          data: {
            dnsServers: mockDnsServers,
          },
        },
      },
      {
        request: {
          query: RUN_DNS_LOOKUP,
          variables: {
            input: {
              deviceId,
              hostname: 'slow-domain.com',
              recordType: 'A',
              server: undefined,
              timeout: 2000,
            },
          },
        },
        result: {
          data: {
            runDnsLookup: mockTimeoutResult,
          },
        },
      },
    ];

    const wrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider mocks={mocks}>{children}</MockedProvider>
    );

    const { result } = renderHook(() => useDnsLookup({ deviceId, onSuccess, onError }), {
      wrapper,
    });

    act(() => {
      result.current.lookup(formValues);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.result?.status).toBe('TIMEOUT');
    expect(onError).toHaveBeenCalledWith('Query timed out');
  });

  it('should perform multi-server comparison with lookupAll()', async () => {
    const formValues: DnsLookupFormValues = {
      hostname: 'google.com',
      recordType: 'A',
      timeout: 2000,
    };

    const result1 = { ...mockARecordResult, server: '8.8.8.8', queryTime: 15 };
    const result2 = { ...mockARecordResult, server: '1.1.1.1', queryTime: 25 };

    const mocks = [
      {
        request: {
          query: GET_DNS_SERVERS,
          variables: { deviceId },
        },
        result: {
          data: {
            dnsServers: mockDnsServers,
          },
        },
      },
      {
        request: {
          query: RUN_DNS_LOOKUP,
          variables: {
            input: {
              deviceId,
              hostname: 'google.com',
              recordType: 'A',
              server: '8.8.8.8',
              timeout: 2000,
            },
          },
        },
        result: {
          data: {
            runDnsLookup: result1,
          },
        },
      },
      {
        request: {
          query: RUN_DNS_LOOKUP,
          variables: {
            input: {
              deviceId,
              hostname: 'google.com',
              recordType: 'A',
              server: '1.1.1.1',
              timeout: 2000,
            },
          },
        },
        result: {
          data: {
            runDnsLookup: result2,
          },
        },
      },
    ];

    const wrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider mocks={mocks}>{children}</MockedProvider>
    );

    const { result } = renderHook(() => useDnsLookup({ deviceId, onSuccess, onError }), {
      wrapper,
    });

    // Wait for DNS servers to load
    await waitFor(() => {
      expect(result.current.dnsServers).toHaveLength(2);
    });

    act(() => {
      result.current.lookupAll(formValues);
    });

    await waitFor(() => {
      expect(result.current.comparisonResults).toHaveLength(2);
    });

    expect(result.current.comparisonResults[0].server).toBe('8.8.8.8');
    expect(result.current.comparisonResults[1].server).toBe('1.1.1.1');
    expect(result.current.result).toEqual(result1);
  });

  it('should reset state correctly', async () => {
    const formValues: DnsLookupFormValues = {
      hostname: 'google.com',
      recordType: 'A',
      timeout: 2000,
    };

    const mocks = [
      {
        request: {
          query: GET_DNS_SERVERS,
          variables: { deviceId },
        },
        result: {
          data: {
            dnsServers: mockDnsServers,
          },
        },
      },
      {
        request: {
          query: RUN_DNS_LOOKUP,
          variables: {
            input: {
              deviceId,
              hostname: 'google.com',
              recordType: 'A',
              server: undefined,
              timeout: 2000,
            },
          },
        },
        result: {
          data: {
            runDnsLookup: mockARecordResult,
          },
        },
      },
    ];

    const wrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider mocks={mocks}>{children}</MockedProvider>
    );

    const { result } = renderHook(() => useDnsLookup({ deviceId, onSuccess, onError }), {
      wrapper,
    });

    act(() => {
      result.current.lookup(formValues);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.result).not.toBeNull();

    act(() => {
      result.current.reset();
    });

    expect(result.current.result).toBeNull();
    expect(result.current.comparisonResults).toEqual([]);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('should load DNS servers from query', async () => {
    const mocks = [
      {
        request: {
          query: GET_DNS_SERVERS,
          variables: { deviceId },
        },
        result: {
          data: {
            dnsServers: mockDnsServers,
          },
        },
      },
    ];

    const wrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider mocks={mocks}>{children}</MockedProvider>
    );

    const { result } = renderHook(() => useDnsLookup({ deviceId, onSuccess, onError }), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.dnsServers).toHaveLength(2);
    });

    expect(result.current.dnsServers[0].address).toBe('8.8.8.8');
    expect(result.current.dnsServers[0].isPrimary).toBe(true);
    expect(result.current.dnsServers[1].address).toBe('1.1.1.1');
    expect(result.current.dnsServers[1].isSecondary).toBe(true);
    expect(result.current.primaryServer).toBe('8.8.8.8');
    expect(result.current.secondaryServer).toBe('1.1.1.1');
  });
});
