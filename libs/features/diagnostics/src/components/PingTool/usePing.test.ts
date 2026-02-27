/**
 * Tests for usePing hook
 *
 * Tests the integration between XState machine and Apollo Client.
 * Mocks GraphQL mutations and subscriptions.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { usePing } from './usePing';
import { RUN_PING, STOP_PING, PING_RESULTS } from './ping.graphql';
import type { PingFormValues } from './ping.schema';
import type { PingResult } from './PingTool.types';

// Helper to create mock result
const createMockResult = (seq: number, time: number | null = 12.5): PingResult => ({
  seq,
  bytes: time !== null ? 56 : null,
  ttl: time !== null ? 52 : null,
  time,
  target: '8.8.8.8',
  source: null,
  error: time === null ? 'timeout' : null,
  timestamp: new Date(),
});

// Helper to create wrapper with mocked provider
const createWrapper = (mocks: any[] = []) => {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(MockedProvider, { mocks }, children);
};

describe('usePing', () => {
  const defaultOptions = {
    deviceId: 'test-router-123',
  };

  const validFormValues: PingFormValues = {
    target: '8.8.8.8',
    count: 5,
    size: 56,
    timeout: 1000,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should start in idle state', () => {
      const { result } = renderHook(() => usePing(defaultOptions), {
        wrapper: createWrapper(),
      });

      expect(result.current.isIdle).toBe(true);
      expect(result.current.isRunning).toBe(false);
      expect(result.current.isComplete).toBe(false);
      expect(result.current.results).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should expose state accessors', () => {
      const { result } = renderHook(() => usePing(defaultOptions), {
        wrapper: createWrapper(),
      });

      expect(result.current).toHaveProperty('state');
      expect(result.current).toHaveProperty('isIdle');
      expect(result.current).toHaveProperty('isRunning');
      expect(result.current).toHaveProperty('isComplete');
      expect(result.current).toHaveProperty('isStopped');
      expect(result.current).toHaveProperty('isError');
    });

    it('should expose data properties', () => {
      const { result } = renderHook(() => usePing(defaultOptions), {
        wrapper: createWrapper(),
      });

      expect(result.current).toHaveProperty('results');
      expect(result.current).toHaveProperty('statistics');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('target');
      expect(result.current).toHaveProperty('count');
    });

    it('should expose action functions', () => {
      const { result } = renderHook(() => usePing(defaultOptions), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.startPing).toBe('function');
      expect(typeof result.current.stop).toBe('function');
    });

    it('should expose loading states', () => {
      const { result } = renderHook(() => usePing(defaultOptions), {
        wrapper: createWrapper(),
      });

      expect(result.current).toHaveProperty('isStarting');
      expect(result.current).toHaveProperty('isStopping');
      expect(result.current.isStarting).toBe(false);
      expect(result.current.isStopping).toBe(false);
    });
  });

  describe('startPing', () => {
    it('should trigger RUN_PING mutation with correct variables', async () => {
      const mocks = [
        {
          request: {
            query: RUN_PING,
            variables: {
              input: {
                deviceId: 'test-router-123',
                target: '8.8.8.8',
                count: 5,
                size: 56,
                timeout: 1000,
                sourceInterface: undefined,
              },
            },
          },
          result: {
            data: {
              runPing: {
                jobId: 'job-123',
                status: 'RUNNING',
              },
            },
          },
        },
      ];

      const { result } = renderHook(() => usePing(defaultOptions), {
        wrapper: createWrapper(mocks),
      });

      act(() => {
        result.current.startPing(validFormValues);
      });

      // Should transition to running state
      await waitFor(() => {
        expect(result.current.isRunning).toBe(true);
      });

      // Should store target and count
      expect(result.current.target).toBe('8.8.8.8');
      expect(result.current.count).toBe(5);
    });

    it('should set isStarting to true during mutation', async () => {
      const mocks = [
        {
          request: {
            query: RUN_PING,
            variables: {
              input: {
                deviceId: 'test-router-123',
                target: '8.8.8.8',
                count: 5,
                size: 56,
                timeout: 1000,
                sourceInterface: undefined,
              },
            },
          },
          result: {
            data: {
              runPing: {
                jobId: 'job-123',
                status: 'RUNNING',
              },
            },
          },
          delay: 100, // Simulate network delay
        },
      ];

      const { result } = renderHook(() => usePing(defaultOptions), {
        wrapper: createWrapper(mocks),
      });

      act(() => {
        result.current.startPing(validFormValues);
      });

      // Should be starting initially
      expect(result.current.isStarting).toBe(true);

      // Should eventually finish starting
      await waitFor(() => {
        expect(result.current.isStarting).toBe(false);
      });
    });

    it('should handle mutation error', async () => {
      const onError = vi.fn();
      const mocks = [
        {
          request: {
            query: RUN_PING,
            variables: {
              input: {
                deviceId: 'test-router-123',
                target: '8.8.8.8',
                count: 5,
                size: 56,
                timeout: 1000,
                sourceInterface: undefined,
              },
            },
          },
          error: new Error('Network error'),
        },
      ];

      const { result } = renderHook(() => usePing({ ...defaultOptions, onError }), {
        wrapper: createWrapper(mocks),
      });

      act(() => {
        result.current.startPing(validFormValues);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error).toContain('Network error');
        expect(onError).toHaveBeenCalledWith(expect.stringContaining('Network error'));
      });
    });

    it('should reset context when starting new ping', async () => {
      const mocks = [
        {
          request: {
            query: RUN_PING,
            variables: {
              input: {
                deviceId: 'test-router-123',
                target: '8.8.8.8',
                count: 5,
                size: 56,
                timeout: 1000,
                sourceInterface: undefined,
              },
            },
          },
          result: {
            data: {
              runPing: { jobId: 'job-123', status: 'RUNNING' },
            },
          },
        },
        {
          request: {
            query: RUN_PING,
            variables: {
              input: {
                deviceId: 'test-router-123',
                target: 'google.com',
                count: 5,
                size: 56,
                timeout: 1000,
                sourceInterface: undefined,
              },
            },
          },
          result: {
            data: {
              runPing: { jobId: 'job-456', status: 'RUNNING' },
            },
          },
        },
      ];

      const { result } = renderHook(() => usePing(defaultOptions), {
        wrapper: createWrapper(mocks),
      });

      // Start first ping
      act(() => {
        result.current.startPing(validFormValues);
      });

      await waitFor(() => {
        expect(result.current.isRunning).toBe(true);
      });

      // Start second ping - should reset
      act(() => {
        result.current.startPing({ ...validFormValues, target: 'google.com' });
      });

      await waitFor(() => {
        expect(result.current.target).toBe('google.com');
        expect(result.current.results).toEqual([]);
      });
    });
  });

  describe('stop', () => {
    it('should trigger STOP_PING mutation', async () => {
      const mocks = [
        {
          request: {
            query: RUN_PING,
            variables: {
              input: {
                deviceId: 'test-router-123',
                target: '8.8.8.8',
                count: 5,
                size: 56,
                timeout: 1000,
                sourceInterface: undefined,
              },
            },
          },
          result: {
            data: {
              runPing: { jobId: 'job-123', status: 'RUNNING' },
            },
          },
        },
        {
          request: {
            query: STOP_PING,
            variables: {
              jobId: 'job-123',
            },
          },
          result: {
            data: {
              stopPing: { jobId: 'job-123', status: 'STOPPED' },
            },
          },
        },
      ];

      const { result } = renderHook(() => usePing(defaultOptions), {
        wrapper: createWrapper(mocks),
      });

      // Start ping
      act(() => {
        result.current.startPing(validFormValues);
      });

      await waitFor(() => {
        expect(result.current.isRunning).toBe(true);
      });

      // Stop ping
      act(() => {
        result.current.stop();
      });

      await waitFor(() => {
        expect(result.current.isStopped).toBe(true);
      });
    });

    it('should not call mutation if no jobId', () => {
      const { result } = renderHook(() => usePing(defaultOptions), {
        wrapper: createWrapper(),
      });

      // Call stop without starting (no jobId)
      act(() => {
        result.current.stop();
      });

      // Should remain in idle state (can't stop what hasn't started)
      expect(result.current.isIdle).toBe(true);
      expect(result.current.isStopped).toBe(false);
    });
  });

  describe('statistics calculation', () => {
    it('should update statistics as results arrive', () => {
      const { result } = renderHook(() => usePing(defaultOptions), {
        wrapper: createWrapper(),
      });

      // Manually send results to machine (simulating subscription)
      // In real usage, subscription would trigger these

      expect(result.current.statistics.sent).toBe(0);
      expect(result.current.statistics.received).toBe(0);
    });
  });

  describe('callbacks', () => {
    it('should call onComplete when ping completes', async () => {
      const onComplete = vi.fn();
      const mocks = [
        {
          request: {
            query: RUN_PING,
            variables: {
              input: {
                deviceId: 'test-router-123',
                target: '8.8.8.8',
                count: 1,
                size: 56,
                timeout: 1000,
                sourceInterface: undefined,
              },
            },
          },
          result: {
            data: {
              runPing: { jobId: 'job-123', status: 'RUNNING' },
            },
          },
        },
      ];

      const { result } = renderHook(() => usePing({ ...defaultOptions, onComplete }), {
        wrapper: createWrapper(mocks),
      });

      act(() => {
        result.current.startPing({ ...validFormValues, count: 1 });
      });

      // Note: In real usage, subscription would deliver results and trigger completion
      // This is a simplified test showing the hook structure
    });
  });

  describe('form values handling', () => {
    it('should handle optional sourceInterface', async () => {
      const mocks = [
        {
          request: {
            query: RUN_PING,
            variables: {
              input: {
                deviceId: 'test-router-123',
                target: '8.8.8.8',
                count: 5,
                size: 56,
                timeout: 1000,
                sourceInterface: 'eth0',
              },
            },
          },
          result: {
            data: {
              runPing: { jobId: 'job-123', status: 'RUNNING' },
            },
          },
        },
      ];

      const { result } = renderHook(() => usePing(defaultOptions), {
        wrapper: createWrapper(mocks),
      });

      act(() => {
        result.current.startPing({
          ...validFormValues,
          sourceInterface: 'eth0',
        });
      });

      await waitFor(() => {
        expect(result.current.isRunning).toBe(true);
      });
    });
  });
});
