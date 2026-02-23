// =============================================================================
// useTraceroute Hook Tests
// Story NAS-5.8: Traceroute Diagnostic Tool
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { ReactNode } from 'react';
import { useTraceroute } from './useTraceroute';
import {
  RUN_TRACEROUTE,
  CANCEL_TRACEROUTE,
  TRACEROUTE_PROGRESS_SUBSCRIPTION,
} from '../graphql/traceroute.graphql';

// -----------------------------------------------------------------------------
// Test Utilities
// -----------------------------------------------------------------------------

const createWrapper = (mocks: MockedResponse[]) => {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MockedProvider mocks={mocks} addTypename={false}>
        {children}
      </MockedProvider>
    );
  };
};

// -----------------------------------------------------------------------------
// Test Data
// -----------------------------------------------------------------------------

const mockDeviceId = 'router-123';
const mockJobId = 'traceroute-job-abc-123';

const mockTracerouteInput = {
  target: '8.8.8.8',
  maxHops: 30,
  timeout: 3000,
  probeCount: 3,
  protocol: 'ICMP' as const,
};

const mockHop1 = {
  hopNumber: 1,
  address: '192.168.1.1',
  hostname: 'gateway.local',
  status: 'SUCCESS',
  avgLatencyMs: 0.5,
  packetLoss: 0,
  probes: [
    { probeNumber: 1, latencyMs: 0.4, success: true, icmpCode: null },
    { probeNumber: 2, latencyMs: 0.5, success: true, icmpCode: null },
    { probeNumber: 3, latencyMs: 0.6, success: true, icmpCode: null },
  ],
};

const mockHop2 = {
  hopNumber: 2,
  address: '10.0.0.1',
  hostname: null,
  status: 'SUCCESS',
  avgLatencyMs: 5.2,
  packetLoss: 0,
  probes: [
    { probeNumber: 1, latencyMs: 5.1, success: true, icmpCode: null },
    { probeNumber: 2, latencyMs: 5.2, success: true, icmpCode: null },
    { probeNumber: 3, latencyMs: 5.3, success: true, icmpCode: null },
  ],
};

const mockHopTimeout = {
  hopNumber: 3,
  address: null,
  hostname: null,
  status: 'TIMEOUT',
  avgLatencyMs: null,
  packetLoss: 100,
  probes: [
    { probeNumber: 1, latencyMs: null, success: false, icmpCode: null },
    { probeNumber: 2, latencyMs: null, success: false, icmpCode: null },
    { probeNumber: 3, latencyMs: null, success: false, icmpCode: null },
  ],
};

const mockFinalResult = {
  target: '8.8.8.8',
  targetIp: '8.8.8.8',
  protocol: 'ICMP',
  maxHops: 30,
  hops: [mockHop1, mockHop2, mockHopTimeout],
  completed: true,
  reachedDestination: true,
  totalTimeMs: 150.5,
  startedAt: new Date('2026-02-05T12:00:00Z'),
  completedAt: new Date('2026-02-05T12:00:01Z'),
};

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('useTraceroute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should start in idle state with empty hops', () => {
      const mocks: MockedResponse[] = [];
      const wrapper = createWrapper(mocks);

      const { result } = renderHook(
        () => useTraceroute({ deviceId: mockDeviceId }),
        { wrapper }
      );

      expect(result.current.isRunning).toBe(false);
      expect(result.current.hops).toEqual([]);
      expect(result.current.result).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.progress).toBe(0);
    });
  });

  describe('run()', () => {
    it('should start traceroute with correct variables', async () => {
      const mocks: MockedResponse[] = [
        {
          request: {
            query: RUN_TRACEROUTE,
            variables: {
              deviceId: mockDeviceId,
              input: mockTracerouteInput,
            },
          },
          result: {
            data: {
              runTraceroute: {
                jobId: mockJobId,
                status: 'RUNNING',
              },
            },
          },
        },
      ];

      const wrapper = createWrapper(mocks);

      const { result } = renderHook(
        () => useTraceroute({ deviceId: mockDeviceId }),
        { wrapper }
      );

      await act(async () => {
        await result.current.run(mockTracerouteInput);
      });

      await waitFor(() => {
        expect(result.current.isRunning).toBe(true);
      });
    });

    it('should reset state before starting new traceroute', async () => {
      const mocks: MockedResponse[] = [
        {
          request: {
            query: RUN_TRACEROUTE,
            variables: {
              deviceId: mockDeviceId,
              input: mockTracerouteInput,
            },
          },
          result: {
            data: {
              runTraceroute: {
                jobId: mockJobId,
                status: 'RUNNING',
              },
            },
          },
        },
      ];

      const wrapper = createWrapper(mocks);

      const { result } = renderHook(
        () => useTraceroute({ deviceId: mockDeviceId }),
        { wrapper }
      );

      // Manually set some state (simulating previous run)
      act(() => {
        (result.current as any).hops = [mockHop1];
        (result.current as any).error = 'Previous error';
      });

      await act(async () => {
        await result.current.run(mockTracerouteInput);
      });

      await waitFor(() => {
        expect(result.current.hops).toEqual([]);
        expect(result.current.error).toBeNull();
        expect(result.current.progress).toBe(0);
      });
    });

    it('should handle mutation errors gracefully', async () => {
      const errorMessage = 'Failed to start traceroute';
      const onError = vi.fn();

      const mocks: MockedResponse[] = [
        {
          request: {
            query: RUN_TRACEROUTE,
            variables: {
              deviceId: mockDeviceId,
              input: mockTracerouteInput,
            },
          },
          error: new Error(errorMessage),
        },
      ];

      const wrapper = createWrapper(mocks);

      const { result } = renderHook(
        () => useTraceroute({ deviceId: mockDeviceId, onError }),
        { wrapper }
      );

      await act(async () => {
        await result.current.run(mockTracerouteInput);
      });

      await waitFor(() => {
        expect(result.current.error).toContain(errorMessage);
        expect(result.current.isRunning).toBe(false);
        expect(onError).toHaveBeenCalledWith(expect.stringContaining(errorMessage));
      });
    });
  });

  describe('cancel()', () => {
    it('should cancel running traceroute', async () => {
      const mocks: MockedResponse[] = [
        {
          request: {
            query: RUN_TRACEROUTE,
            variables: {
              deviceId: mockDeviceId,
              input: mockTracerouteInput,
            },
          },
          result: {
            data: {
              runTraceroute: {
                jobId: mockJobId,
                status: 'RUNNING',
              },
            },
          },
        },
        {
          request: {
            query: CANCEL_TRACEROUTE,
            variables: {
              jobId: mockJobId,
            },
          },
          result: {
            data: {
              cancelTraceroute: true,
            },
          },
        },
      ];

      const wrapper = createWrapper(mocks);

      const { result } = renderHook(
        () => useTraceroute({ deviceId: mockDeviceId }),
        { wrapper }
      );

      // Start traceroute
      await act(async () => {
        await result.current.run(mockTracerouteInput);
      });

      await waitFor(() => {
        expect(result.current.isRunning).toBe(true);
      });

      // Cancel traceroute
      await act(async () => {
        await result.current.cancel();
      });

      // Note: The subscription will receive CANCELLED event to update state
    });

    it('should not cancel if no job is running', async () => {
      const mocks: MockedResponse[] = [];
      const wrapper = createWrapper(mocks);

      const { result } = renderHook(
        () => useTraceroute({ deviceId: mockDeviceId }),
        { wrapper }
      );

      // Try to cancel without starting
      await act(async () => {
        await result.current.cancel();
      });

      // Should be no-op (no error thrown)
      expect(result.current.isRunning).toBe(false);
    });
  });

  describe('Progress Events', () => {
    it('should accumulate hops as they are discovered', async () => {
      const onHopDiscovered = vi.fn();

      const mocks: MockedResponse[] = [
        {
          request: {
            query: RUN_TRACEROUTE,
            variables: {
              deviceId: mockDeviceId,
              input: mockTracerouteInput,
            },
          },
          result: {
            data: {
              runTraceroute: {
                jobId: mockJobId,
                status: 'RUNNING',
              },
            },
          },
        },
        {
          request: {
            query: TRACEROUTE_PROGRESS_SUBSCRIPTION,
            variables: {
              jobId: mockJobId,
            },
          },
          result: {
            data: {
              tracerouteProgress: {
                jobId: mockJobId,
                eventType: 'HOP_DISCOVERED',
                hop: mockHop1,
                result: null,
                error: null,
              },
            },
          },
        },
        {
          request: {
            query: TRACEROUTE_PROGRESS_SUBSCRIPTION,
            variables: {
              jobId: mockJobId,
            },
          },
          result: {
            data: {
              tracerouteProgress: {
                jobId: mockJobId,
                eventType: 'HOP_DISCOVERED',
                hop: mockHop2,
                result: null,
                error: null,
              },
            },
          },
        },
      ];

      const wrapper = createWrapper(mocks);

      const { result } = renderHook(
        () => useTraceroute({ deviceId: mockDeviceId, onHopDiscovered }),
        { wrapper }
      );

      await act(async () => {
        await result.current.run(mockTracerouteInput);
      });

      // Wait for hops to be discovered
      await waitFor(
        () => {
          expect(result.current.hops.length).toBeGreaterThan(0);
        },
        { timeout: 3000 }
      );

      expect(onHopDiscovered).toHaveBeenCalled();
    });

    it('should update progress as hops are discovered', async () => {
      const mocks: MockedResponse[] = [
        {
          request: {
            query: RUN_TRACEROUTE,
            variables: {
              deviceId: mockDeviceId,
              input: mockTracerouteInput,
            },
          },
          result: {
            data: {
              runTraceroute: {
                jobId: mockJobId,
                status: 'RUNNING',
              },
            },
          },
        },
        {
          request: {
            query: TRACEROUTE_PROGRESS_SUBSCRIPTION,
            variables: {
              jobId: mockJobId,
            },
          },
          result: {
            data: {
              tracerouteProgress: {
                jobId: mockJobId,
                eventType: 'HOP_DISCOVERED',
                hop: mockHop1,
                result: null,
                error: null,
              },
            },
          },
        },
      ];

      const wrapper = createWrapper(mocks);

      const { result } = renderHook(
        () => useTraceroute({ deviceId: mockDeviceId }),
        { wrapper }
      );

      await act(async () => {
        await result.current.run(mockTracerouteInput);
      });

      await waitFor(
        () => {
          expect(result.current.progress).toBeGreaterThan(0);
        },
        { timeout: 3000 }
      );

      // Progress should be calculated as (hopNumber / maxHops) * 100
      // For hop 1 out of 30: (1 / 30) * 100 ≈ 3.33%
      expect(result.current.progress).toBeCloseTo(3.33, 1);
    });

    it('should handle COMPLETE event', async () => {
      const onComplete = vi.fn();

      const mocks: MockedResponse[] = [
        {
          request: {
            query: RUN_TRACEROUTE,
            variables: {
              deviceId: mockDeviceId,
              input: mockTracerouteInput,
            },
          },
          result: {
            data: {
              runTraceroute: {
                jobId: mockJobId,
                status: 'RUNNING',
              },
            },
          },
        },
        {
          request: {
            query: TRACEROUTE_PROGRESS_SUBSCRIPTION,
            variables: {
              jobId: mockJobId,
            },
          },
          result: {
            data: {
              tracerouteProgress: {
                jobId: mockJobId,
                eventType: 'COMPLETE',
                hop: null,
                result: mockFinalResult,
                error: null,
              },
            },
          },
        },
      ];

      const wrapper = createWrapper(mocks);

      const { result } = renderHook(
        () => useTraceroute({ deviceId: mockDeviceId, onComplete }),
        { wrapper }
      );

      await act(async () => {
        await result.current.run(mockTracerouteInput);
      });

      await waitFor(
        () => {
          expect(result.current.result).not.toBeNull();
        },
        { timeout: 3000 }
      );

      expect(result.current.isRunning).toBe(false);
      expect(result.current.progress).toBe(100);
      expect(onComplete).toHaveBeenCalledWith(mockFinalResult);
    });

    it('should handle ERROR event', async () => {
      const errorMessage = 'Traceroute failed: Network unreachable';
      const onError = vi.fn();

      const mocks: MockedResponse[] = [
        {
          request: {
            query: RUN_TRACEROUTE,
            variables: {
              deviceId: mockDeviceId,
              input: mockTracerouteInput,
            },
          },
          result: {
            data: {
              runTraceroute: {
                jobId: mockJobId,
                status: 'RUNNING',
              },
            },
          },
        },
        {
          request: {
            query: TRACEROUTE_PROGRESS_SUBSCRIPTION,
            variables: {
              jobId: mockJobId,
            },
          },
          result: {
            data: {
              tracerouteProgress: {
                jobId: mockJobId,
                eventType: 'ERROR',
                hop: null,
                result: null,
                error: errorMessage,
              },
            },
          },
        },
      ];

      const wrapper = createWrapper(mocks);

      const { result } = renderHook(
        () => useTraceroute({ deviceId: mockDeviceId, onError }),
        { wrapper }
      );

      await act(async () => {
        await result.current.run(mockTracerouteInput);
      });

      await waitFor(
        () => {
          expect(result.current.error).toBe(errorMessage);
        },
        { timeout: 3000 }
      );

      expect(result.current.isRunning).toBe(false);
      expect(onError).toHaveBeenCalledWith(errorMessage);
    });

    it('should handle CANCELLED event', async () => {
      const onCancelled = vi.fn();

      const mocks: MockedResponse[] = [
        {
          request: {
            query: RUN_TRACEROUTE,
            variables: {
              deviceId: mockDeviceId,
              input: mockTracerouteInput,
            },
          },
          result: {
            data: {
              runTraceroute: {
                jobId: mockJobId,
                status: 'RUNNING',
              },
            },
          },
        },
        {
          request: {
            query: TRACEROUTE_PROGRESS_SUBSCRIPTION,
            variables: {
              jobId: mockJobId,
            },
          },
          result: {
            data: {
              tracerouteProgress: {
                jobId: mockJobId,
                eventType: 'CANCELLED',
                hop: null,
                result: null,
                error: null,
              },
            },
          },
        },
      ];

      const wrapper = createWrapper(mocks);

      const { result } = renderHook(
        () => useTraceroute({ deviceId: mockDeviceId, onCancelled }),
        { wrapper }
      );

      await act(async () => {
        await result.current.run(mockTracerouteInput);
      });

      await waitFor(
        () => {
          expect(result.current.isRunning).toBe(false);
        },
        { timeout: 3000 }
      );

      expect(onCancelled).toHaveBeenCalled();
    });
  });

  describe('Hop Handling', () => {
    it('should handle hops with timeouts (no address)', async () => {
      const mocks: MockedResponse[] = [
        {
          request: {
            query: RUN_TRACEROUTE,
            variables: {
              deviceId: mockDeviceId,
              input: mockTracerouteInput,
            },
          },
          result: {
            data: {
              runTraceroute: {
                jobId: mockJobId,
                status: 'RUNNING',
              },
            },
          },
        },
        {
          request: {
            query: TRACEROUTE_PROGRESS_SUBSCRIPTION,
            variables: {
              jobId: mockJobId,
            },
          },
          result: {
            data: {
              tracerouteProgress: {
                jobId: mockJobId,
                eventType: 'HOP_DISCOVERED',
                hop: mockHopTimeout,
                result: null,
                error: null,
              },
            },
          },
        },
      ];

      const wrapper = createWrapper(mocks);

      const { result } = renderHook(
        () => useTraceroute({ deviceId: mockDeviceId }),
        { wrapper }
      );

      await act(async () => {
        await result.current.run(mockTracerouteInput);
      });

      await waitFor(
        () => {
          expect(result.current.hops.length).toBe(1);
        },
        { timeout: 3000 }
      );

      const hop = result.current.hops[0];
      expect(hop.address).toBeNull();
      expect(hop.status).toBe('TIMEOUT');
      expect(hop.avgLatencyMs).toBeNull();
      expect(hop.packetLoss).toBe(100);
    });

    it('should sort hops by hop number', async () => {
      const mocks: MockedResponse[] = [
        {
          request: {
            query: RUN_TRACEROUTE,
            variables: {
              deviceId: mockDeviceId,
              input: mockTracerouteInput,
            },
          },
          result: {
            data: {
              runTraceroute: {
                jobId: mockJobId,
                status: 'RUNNING',
              },
            },
          },
        },
        {
          request: {
            query: TRACEROUTE_PROGRESS_SUBSCRIPTION,
            variables: {
              jobId: mockJobId,
            },
          },
          result: {
            data: {
              tracerouteProgress: {
                jobId: mockJobId,
                eventType: 'HOP_DISCOVERED',
                hop: mockHop2, // Hop 2 arrives first
                result: null,
                error: null,
              },
            },
          },
        },
        {
          request: {
            query: TRACEROUTE_PROGRESS_SUBSCRIPTION,
            variables: {
              jobId: mockJobId,
            },
          },
          result: {
            data: {
              tracerouteProgress: {
                jobId: mockJobId,
                eventType: 'HOP_DISCOVERED',
                hop: mockHop1, // Hop 1 arrives second
                result: null,
                error: null,
              },
            },
          },
        },
      ];

      const wrapper = createWrapper(mocks);

      const { result } = renderHook(
        () => useTraceroute({ deviceId: mockDeviceId }),
        { wrapper }
      );

      await act(async () => {
        await result.current.run(mockTracerouteInput);
      });

      await waitFor(
        () => {
          expect(result.current.hops.length).toBe(2);
        },
        { timeout: 3000 }
      );

      // Hops should be sorted by hopNumber
      expect(result.current.hops[0].hopNumber).toBe(1);
      expect(result.current.hops[1].hopNumber).toBe(2);
    });
  });
});
