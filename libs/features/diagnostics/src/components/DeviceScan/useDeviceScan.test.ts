// =============================================================================
// useDeviceScan Hook Tests
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { ReactNode } from 'react';
import { useDeviceScan, RUN_DEVICE_SCAN, DEVICE_SCAN_PROGRESS } from './useDeviceScan';

// -----------------------------------------------------------------------------
// Test Utilities
// -----------------------------------------------------------------------------

const createWrapper = (mocks: MockedResponse[]) => {
  return ({ children }: { children: ReactNode }) => (
    <MockedProvider mocks={mocks} addTypename={false}>
      {children}
    </MockedProvider>
  );
};

// -----------------------------------------------------------------------------
// Test Data
// -----------------------------------------------------------------------------

const mockDeviceId = 'router-123';

const mockScanId = 'scan-abc-123';

const mockDiscoveredDevice = {
  ip: '192.168.88.100',
  mac: '00:0F:E2:12:34:56',
  hostname: 'test-device',
  interface: 'bridge1',
  responseTime: 10,
  firstSeen: '2026-02-05T12:00:00Z',
  dhcpLease: null,
};

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('useDeviceScan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should start in idle state', () => {
      const mocks: MockedResponse[] = [];
      const wrapper = createWrapper(mocks);

      const { result } = renderHook(
        () => useDeviceScan({ deviceId: mockDeviceId }),
        { wrapper }
      );

      expect(result.current.status).toBe('idle');
      expect(result.current.progress).toBe(0);
      expect(result.current.devices).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(result.current.isIdle).toBe(true);
      expect(result.current.isScanning).toBe(false);
      expect(result.current.isComplete).toBe(false);
    });
  });

  describe('startScan', () => {
    it('should initiate scan with correct variables', async () => {
      const mocks: MockedResponse[] = [
        {
          request: {
            query: RUN_DEVICE_SCAN,
            variables: {
              input: {
                deviceId: mockDeviceId,
                subnet: '192.168.88.0/24',
                interface: 'bridge1',
                timeout: 500,
                concurrency: 10,
              },
            },
          },
          result: {
            data: {
              runDeviceScan: {
                scanId: mockScanId,
                status: 'SCANNING',
              },
            },
          },
        },
      ];

      const wrapper = createWrapper(mocks);

      const { result } = renderHook(
        () => useDeviceScan({ deviceId: mockDeviceId }),
        { wrapper }
      );

      act(() => {
        result.current.startScan('192.168.88.0/24', 'bridge1');
      });

      await waitFor(() => {
        expect(result.current.status).toBe('scanning');
      });
    });

    it('should handle scan initiation errors', async () => {
      const mockOnError = vi.fn();

      const mocks: MockedResponse[] = [
        {
          request: {
            query: RUN_DEVICE_SCAN,
            variables: {
              input: {
                deviceId: mockDeviceId,
                subnet: '192.168.88.0/24',
                interface: undefined,
                timeout: 500,
                concurrency: 10,
              },
            },
          },
          error: new Error('Network error'),
        },
      ];

      const wrapper = createWrapper(mocks);

      const { result } = renderHook(
        () =>
          useDeviceScan({
            deviceId: mockDeviceId,
            onError: mockOnError,
          }),
        { wrapper }
      );

      act(() => {
        result.current.startScan('192.168.88.0/24');
      });

      await waitFor(() => {
        expect(result.current.status).toBe('error');
        expect(result.current.hasError).toBe(true);
        expect(mockOnError).toHaveBeenCalledWith('Network error');
      });
    });
  });

  describe('Scan Progress', () => {
    it('should update progress from subscription', async () => {
      const mocks: MockedResponse[] = [
        {
          request: {
            query: RUN_DEVICE_SCAN,
            variables: {
              input: {
                deviceId: mockDeviceId,
                subnet: '192.168.88.0/24',
                interface: undefined,
                timeout: 500,
                concurrency: 10,
              },
            },
          },
          result: {
            data: {
              runDeviceScan: {
                scanId: mockScanId,
                status: 'SCANNING',
              },
            },
          },
        },
        {
          request: {
            query: DEVICE_SCAN_PROGRESS,
            variables: { scanId: mockScanId },
          },
          result: {
            data: {
              deviceScanProgress: {
                scanId: mockScanId,
                status: 'SCANNING',
                progress: 50,
                scannedCount: 127,
                totalCount: 254,
                discoveredDevices: [mockDiscoveredDevice],
                elapsedTime: 15000,
                error: null,
              },
            },
          },
        },
      ];

      const wrapper = createWrapper(mocks);

      const { result } = renderHook(
        () => useDeviceScan({ deviceId: mockDeviceId }),
        { wrapper }
      );

      act(() => {
        result.current.startScan('192.168.88.0/24');
      });

      await waitFor(() => {
        expect(result.current.progress).toBe(50);
        expect(result.current.stats.scannedCount).toBe(127);
        expect(result.current.stats.totalCount).toBe(254);
        expect(result.current.devices).toHaveLength(1);
      });
    });

    it('should enrich devices with vendor lookup', async () => {
      const mocks: MockedResponse[] = [
        {
          request: {
            query: RUN_DEVICE_SCAN,
            variables: {
              input: {
                deviceId: mockDeviceId,
                subnet: '192.168.88.0/24',
                interface: undefined,
                timeout: 500,
                concurrency: 10,
              },
            },
          },
          result: {
            data: {
              runDeviceScan: {
                scanId: mockScanId,
                status: 'SCANNING',
              },
            },
          },
        },
        {
          request: {
            query: DEVICE_SCAN_PROGRESS,
            variables: { scanId: mockScanId },
          },
          result: {
            data: {
              deviceScanProgress: {
                scanId: mockScanId,
                status: 'SCANNING',
                progress: 10,
                scannedCount: 25,
                totalCount: 254,
                discoveredDevices: [mockDiscoveredDevice],
                elapsedTime: 5000,
                error: null,
              },
            },
          },
        },
      ];

      const wrapper = createWrapper(mocks);

      const { result } = renderHook(
        () => useDeviceScan({ deviceId: mockDeviceId }),
        { wrapper }
      );

      act(() => {
        result.current.startScan('192.168.88.0/24');
      });

      await waitFor(() => {
        expect(result.current.devices).toHaveLength(1);
        expect(result.current.devices[0].vendor).toBe('MikroTik');
      });
    });
  });

  describe('Scan Completion', () => {
    it('should handle scan completion and call onComplete callback', async () => {
      const mockOnComplete = vi.fn();

      const mocks: MockedResponse[] = [
        {
          request: {
            query: RUN_DEVICE_SCAN,
            variables: {
              input: {
                deviceId: mockDeviceId,
                subnet: '192.168.88.0/24',
                interface: undefined,
                timeout: 500,
                concurrency: 10,
              },
            },
          },
          result: {
            data: {
              runDeviceScan: {
                scanId: mockScanId,
                status: 'SCANNING',
              },
            },
          },
        },
        {
          request: {
            query: DEVICE_SCAN_PROGRESS,
            variables: { scanId: mockScanId },
          },
          result: {
            data: {
              deviceScanProgress: {
                scanId: mockScanId,
                status: 'COMPLETED',
                progress: 100,
                scannedCount: 254,
                totalCount: 254,
                discoveredDevices: [mockDiscoveredDevice],
                elapsedTime: 30000,
                error: null,
              },
            },
          },
        },
      ];

      const wrapper = createWrapper(mocks);

      const { result } = renderHook(
        () =>
          useDeviceScan({
            deviceId: mockDeviceId,
            onComplete: mockOnComplete,
          }),
        { wrapper }
      );

      act(() => {
        result.current.startScan('192.168.88.0/24');
      });

      await waitFor(() => {
        expect(result.current.status).toBe('completed');
        expect(result.current.isComplete).toBe(true);
        expect(result.current.progress).toBe(100);
        expect(mockOnComplete).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              ip: mockDiscoveredDevice.ip,
              mac: mockDiscoveredDevice.mac,
            }),
          ])
        );
      });
    });
  });

  describe('reset', () => {
    it('should reset scan state to idle', () => {
      const mocks: MockedResponse[] = [];
      const wrapper = createWrapper(mocks);

      const { result } = renderHook(
        () => useDeviceScan({ deviceId: mockDeviceId }),
        { wrapper }
      );

      act(() => {
        result.current.reset();
      });

      expect(result.current.status).toBe('idle');
      expect(result.current.progress).toBe(0);
      expect(result.current.devices).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(result.current.stats).toEqual({
        scannedCount: 0,
        totalCount: 0,
        elapsedTime: 0,
      });
    });
  });
});
