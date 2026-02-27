/**
 * Unit Tests for Network Scanning Service
 * Tests for Epic 0.1, Story 0-1-1
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  startNetworkScan,
  validateSubnet,
  getDefaultSubnet,
  scanResultToRouter,
  ScanError,
} from './scanService';
import type { ScanResult, ScanProgress } from '@nasnet/core/types';

describe('scanService', () => {
  describe('validateSubnet', () => {
    it('should validate correct IPv4 CIDR notation', () => {
      expect(validateSubnet('192.168.88.0/24')).toBe(true);
      expect(validateSubnet('10.0.0.0/8')).toBe(true);
      expect(validateSubnet('172.16.0.0/16')).toBe(true);
      expect(validateSubnet('192.168.1.0/32')).toBe(true);
    });

    it('should reject invalid CIDR notation', () => {
      expect(validateSubnet('192.168.88.0')).toBe(false); // Missing mask
      expect(validateSubnet('192.168.88.0/33')).toBe(false); // Invalid mask
      expect(validateSubnet('256.168.88.0/24')).toBe(false); // Invalid octet
      expect(validateSubnet('192.168.88/24')).toBe(false); // Missing octet
      expect(validateSubnet('not-an-ip/24')).toBe(false); // Invalid format
      expect(validateSubnet('')).toBe(false); // Empty string
    });

    it('should validate edge cases', () => {
      expect(validateSubnet('0.0.0.0/0')).toBe(true);
      expect(validateSubnet('255.255.255.255/32')).toBe(true);
      expect(validateSubnet('192.168.88.1/24')).toBe(true); // Non-network address
    });
  });

  describe('getDefaultSubnet', () => {
    it('should return MikroTik default subnet', () => {
      expect(getDefaultSubnet()).toBe('192.168.88.0/24');
    });
  });

  describe('scanResultToRouter', () => {
    it('should convert scan result to router object', () => {
      const scanResult: ScanResult = {
        ipAddress: '192.168.88.1',
        isReachable: true,
        model: 'hEX S',
        routerOsVersion: '7.10',
        macAddress: 'AA:BB:CC:DD:EE:FF',
        responseTime: 50,
      };

      const router = scanResultToRouter(scanResult);

      expect(router.ipAddress).toBe('192.168.88.1');
      expect(router.name).toBe('hEX S');
      expect(router.model).toBe('hEX S');
      expect(router.routerOsVersion).toBe('7.10');
      expect(router.macAddress).toBe('AA:BB:CC:DD:EE:FF');
      expect(router.connectionStatus).toBe('unknown');
      expect(router.discoveryMethod).toBe('scan');
    });

    it('should use IP as name when model is not provided', () => {
      const scanResult: ScanResult = {
        ipAddress: '192.168.1.1',
        isReachable: true,
      };

      const router = scanResultToRouter(scanResult);

      expect(router.name).toBe('Router 192.168.1.1');
    });

    it('should handle partial scan results', () => {
      const scanResult: ScanResult = {
        ipAddress: '10.0.0.1',
        isReachable: true,
        model: 'CCR1009',
      };

      const router = scanResultToRouter(scanResult);

      expect(router.ipAddress).toBe('10.0.0.1');
      expect(router.model).toBe('CCR1009');
      expect(router.routerOsVersion).toBeUndefined();
      expect(router.macAddress).toBeUndefined();
    });
  });

  describe('startNetworkScan', () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should initiate scan and poll for results', async () => {
      const mockTaskId = 'scan-task-123';
      const mockResults: ScanResult[] = [
        {
          ipAddress: '192.168.88.1',
          isReachable: true,
          model: 'hEX S',
          routerOsVersion: '7.10',
          responseTime: 45,
        },
      ];

      // Mock scan initiation
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ task_id: mockTaskId }),
      });

      // Mock status polling - first running, then completed
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: 'running',
            progress: {
              total_hosts: 254,
              scanned_hosts: 100,
              found_routers: 0,
              current_ip: '192.168.88.100',
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: 'completed',
            progress: {
              total_hosts: 254,
              scanned_hosts: 254,
              found_routers: 1,
              current_ip: '192.168.88.254',
            },
            results: [
              {
                ip_address: '192.168.88.1',
                is_reachable: true,
                model: 'hEX S',
                router_os_version: '7.10',
                response_time: 45,
              },
            ],
          }),
        });

      const results = await startNetworkScan('192.168.88.0/24');

      expect(results).toHaveLength(1);
      expect(results[0].ipAddress).toBe('192.168.88.1');
      expect(results[0].model).toBe('hEX S');
    });

    it('should call onProgress callback during scanning', async () => {
      const mockTaskId = 'scan-task-456';
      const onProgressMock = vi.fn();

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ task_id: mockTaskId }),
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'completed',
          progress: {
            total_hosts: 254,
            scanned_hosts: 254,
            found_routers: 0,
            current_ip: '192.168.88.254',
          },
          results: [],
        }),
      });

      await startNetworkScan('192.168.88.0/24', onProgressMock);

      expect(onProgressMock).toHaveBeenCalled();
      expect(onProgressMock).toHaveBeenCalledWith(
        expect.objectContaining({
          totalHosts: 254,
          scannedHosts: 254,
          foundRouters: 0,
          currentIp: '192.168.88.254',
          isScanning: false,
        })
      );
    });

    it('should throw ScanError on scan initiation failure', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'Backend error' }),
      });

      await expect(startNetworkScan('192.168.88.0/24')).rejects.toThrow(ScanError);
      await expect(startNetworkScan('192.168.88.0/24')).rejects.toThrow(/Failed to start scan/);
    });

    it('should throw ScanError when task_id is missing', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Success' }), // No task_id
      });

      await expect(startNetworkScan('192.168.88.0/24')).rejects.toThrow(ScanError);
      await expect(startNetworkScan('192.168.88.0/24')).rejects.toThrow(/No task ID returned/);
    });

    it('should throw ScanError on scan failure status', async () => {
      const mockTaskId = 'scan-task-789';

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ task_id: mockTaskId }),
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'failed',
          error: 'Network unreachable',
        }),
      });

      await expect(startNetworkScan('192.168.88.0/24')).rejects.toThrow(ScanError);
      await expect(startNetworkScan('192.168.88.0/24')).rejects.toThrow(/Network unreachable/);
    });

    it('should throw ScanError on network error', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

      await expect(startNetworkScan('192.168.88.0/24')).rejects.toThrow(ScanError);
      await expect(startNetworkScan('192.168.88.0/24')).rejects.toThrow(/Network error/);
    });

    it('should handle empty results', async () => {
      const mockTaskId = 'scan-task-empty';

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ task_id: mockTaskId }),
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'completed',
          progress: {
            total_hosts: 254,
            scanned_hosts: 254,
            found_routers: 0,
            current_ip: '192.168.88.254',
          },
          results: [],
        }),
      });

      const results = await startNetworkScan('192.168.88.0/24');

      expect(results).toEqual([]);
    });
  });

  describe('ScanError', () => {
    it('should create error with code and message', () => {
      const error = new ScanError('Test error', 'SCAN_FAILED');

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('SCAN_FAILED');
      expect(error.name).toBe('ScanError');
    });

    it('should support all error codes', () => {
      const codes = [
        'SCAN_START_FAILED',
        'INVALID_RESPONSE',
        'NETWORK_ERROR',
        'POLL_FAILED',
        'SCAN_FAILED',
        'POLL_ERROR',
        'TIMEOUT',
      ] as const;

      codes.forEach((code) => {
        const error = new ScanError(`Error: ${code}`, code);
        expect(error.code).toBe(code);
      });
    });
  });
});
