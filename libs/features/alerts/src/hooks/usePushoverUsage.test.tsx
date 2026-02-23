import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { describe, it, expect } from 'vitest';
import { usePushoverUsage } from './usePushoverUsage';
import { gql } from '@apollo/client';

const PUSHOVER_USAGE_QUERY = gql`
  query PushoverUsage {
    pushoverUsage {
      used
      remaining
      limit
      resetAt
    }
  }
`;

describe('usePushoverUsage', () => {
  it('should fetch and return usage data', async () => {
    const mocks = [
      {
        request: { query: PUSHOVER_USAGE_QUERY },
        result: {
          data: {
            pushoverUsage: {
              used: 2000,
              remaining: 8000,
              limit: 10000,
              resetAt: '2025-02-01T00:00:00Z',
            },
          },
        },
      },
    ];

    const wrapper = ({ children }: { children?: React.ReactNode }) => (
      <MockedProvider mocks={mocks} addTypename={false}>
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => usePushoverUsage(), { wrapper });

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.usage).toBeUndefined();

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Verify data
    expect(result.current.usage).toBeDefined();
    expect(result.current.usage?.used).toBe(2000);
    expect(result.current.usage?.remaining).toBe(8000);
    expect(result.current.usage?.limit).toBe(10000);
    expect(result.current.percentUsed).toBe(20);
    expect(result.current.isNearLimit).toBe(false);
    expect(result.current.isExceeded).toBe(false);
  });

  it('should flag near limit when usage > 80%', async () => {
    const mocks = [
      {
        request: { query: PUSHOVER_USAGE_QUERY },
        result: {
          data: {
            pushoverUsage: {
              used: 8500,
              remaining: 1500,
              limit: 10000,
              resetAt: '2025-02-01T00:00:00Z',
            },
          },
        },
      },
    ];

    const wrapper = ({ children }: { children?: React.ReactNode }) => (
      <MockedProvider mocks={mocks} addTypename={false}>
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => usePushoverUsage(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.percentUsed).toBe(85);
    expect(result.current.isNearLimit).toBe(true);
    expect(result.current.isExceeded).toBe(false);
  });

  it('should flag exceeded when remaining = 0', async () => {
    const mocks = [
      {
        request: { query: PUSHOVER_USAGE_QUERY },
        result: {
          data: {
            pushoverUsage: {
              used: 10000,
              remaining: 0,
              limit: 10000,
              resetAt: '2025-02-01T00:00:00Z',
            },
          },
        },
      },
    ];

    const wrapper = ({ children }: { children?: React.ReactNode }) => (
      <MockedProvider mocks={mocks} addTypename={false}>
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => usePushoverUsage(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.percentUsed).toBe(100);
    expect(result.current.isNearLimit).toBe(true);
    expect(result.current.isExceeded).toBe(true);
  });

  it('should handle query errors gracefully', async () => {
    const mocks = [
      {
        request: { query: PUSHOVER_USAGE_QUERY },
        error: new Error('Network error'),
      },
    ];

    const wrapper = ({ children }: { children?: React.ReactNode }) => (
      <MockedProvider mocks={mocks} addTypename={false}>
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => usePushoverUsage(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toBe('Network error');
    expect(result.current.usage).toBeUndefined();
  });

  it('should handle null/undefined usage data', async () => {
    const mocks = [
      {
        request: { query: PUSHOVER_USAGE_QUERY },
        result: {
          data: {
            pushoverUsage: null,
          },
        },
      },
    ];

    const wrapper = ({ children }: { children?: React.ReactNode }) => (
      <MockedProvider mocks={mocks} addTypename={false}>
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => usePushoverUsage(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.usage).toBeUndefined();
    expect(result.current.percentUsed).toBe(0);
    expect(result.current.isNearLimit).toBe(false);
    expect(result.current.isExceeded).toBe(false);
  });

  it('should provide refetch function', async () => {
    const mocks = [
      {
        request: { query: PUSHOVER_USAGE_QUERY },
        result: {
          data: {
            pushoverUsage: {
              used: 2000,
              remaining: 8000,
              limit: 10000,
              resetAt: '2025-02-01T00:00:00Z',
            },
          },
        },
      },
      {
        request: { query: PUSHOVER_USAGE_QUERY },
        result: {
          data: {
            pushoverUsage: {
              used: 2500,
              remaining: 7500,
              limit: 10000,
              resetAt: '2025-02-01T00:00:00Z',
            },
          },
        },
      },
    ];

    const wrapper = ({ children }: { children?: React.ReactNode }) => (
      <MockedProvider mocks={mocks} addTypename={false}>
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => usePushoverUsage(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.usage?.used).toBe(2000);

    // Refetch
    result.current.refetch();

    await waitFor(() => {
      expect(result.current.usage?.used).toBe(2500);
    });
  });
});
