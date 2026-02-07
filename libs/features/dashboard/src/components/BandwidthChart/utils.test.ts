/**
 * Unit tests for bandwidth chart utility functions
 */

import {
  formatBitrate,
  formatBytes,
  formatXAxis,
  formatYAxis,
  downsampleData,
  appendDataPoint,
} from './utils';
import type { BandwidthDataPoint } from './types';

describe('Bandwidth Chart Utilities', () => {
  describe('formatBitrate', () => {
    it('should format bps correctly', () => {
      expect(formatBitrate(500)).toBe('500 bps');
    });

    it('should format Kbps correctly', () => {
      expect(formatBitrate(1500)).toBe('1.5 Kbps');
      expect(formatBitrate(10000)).toBe('10.0 Kbps');
    });

    it('should format Mbps correctly', () => {
      expect(formatBitrate(1500000)).toBe('1.5 Mbps');
      expect(formatBitrate(125000000)).toBe('125.0 Mbps');
    });

    it('should format Gbps correctly', () => {
      expect(formatBitrate(1500000000)).toBe('1.50 Gbps');
      expect(formatBitrate(12500000000)).toBe('12.50 Gbps');
    });
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(500)).toBe('500 B');
    });

    it('should format KB correctly', () => {
      expect(formatBytes(1500)).toBe('1.5 KB');
      expect(formatBytes(10000)).toBe('10.0 KB');
    });

    it('should format MB correctly', () => {
      expect(formatBytes(1048576)).toBe('1.0 MB');
      expect(formatBytes(125000000)).toBe('125.0 MB');
    });

    it('should format GB correctly', () => {
      expect(formatBytes(2147483648)).toBe('2.00 GB');
      expect(formatBytes(12500000000)).toBe('12.50 GB');
    });

    it('should format TB correctly', () => {
      expect(formatBytes(2000000000000)).toBe('2.00 TB');
    });
  });

  describe('formatXAxis', () => {
    const timestamp = new Date('2026-02-05T14:35:22Z').getTime();

    it('should format time only for 5m range', () => {
      const result = formatXAxis(timestamp, '5m');
      expect(result).toMatch(/\d{1,2}:\d{2}/); // Time format
    });

    it('should format time only for 1h range', () => {
      const result = formatXAxis(timestamp, '1h');
      expect(result).toMatch(/\d{1,2}:\d{2}/); // Time format
    });

    it('should format date + time for 24h range', () => {
      const result = formatXAxis(timestamp, '24h');
      expect(result).toBeTruthy();
      // Should include month abbreviation
    });
  });

  describe('formatYAxis', () => {
    it('should format small values without suffix', () => {
      expect(formatYAxis(500)).toBe('500');
    });

    it('should format K suffix', () => {
      expect(formatYAxis(1500)).toBe('1.5K');
      expect(formatYAxis(10000)).toBe('10.0K');
    });

    it('should format M suffix', () => {
      expect(formatYAxis(1500000)).toBe('1.5M');
      expect(formatYAxis(125000000)).toBe('125.0M');
    });

    it('should format G suffix', () => {
      expect(formatYAxis(1500000000)).toBe('1.5G');
      expect(formatYAxis(12500000000)).toBe('12.5G');
    });
  });

  describe('downsampleData', () => {
    const mockData: BandwidthDataPoint[] = Array.from({ length: 1000 }, (_, i) => ({
      timestamp: Date.now() + i * 1000,
      txRate: i * 1000,
      rxRate: i * 2000,
      txBytes: i * 100000,
      rxBytes: i * 200000,
    }));

    it('should return original data if within target points', () => {
      const data = mockData.slice(0, 100);
      const result = downsampleData(data, 200);
      expect(result).toHaveLength(100);
      expect(result).toEqual(data);
    });

    it('should downsample to target points', () => {
      const result = downsampleData(mockData, 100);
      expect(result.length).toBeLessThanOrEqual(100);
    });

    it('should maintain data point structure', () => {
      const result = downsampleData(mockData, 100);
      expect(result[0]).toHaveProperty('timestamp');
      expect(result[0]).toHaveProperty('txRate');
      expect(result[0]).toHaveProperty('rxRate');
      expect(result[0]).toHaveProperty('txBytes');
      expect(result[0]).toHaveProperty('rxBytes');
    });
  });

  describe('appendDataPoint', () => {
    const mockData: BandwidthDataPoint[] = [
      {
        timestamp: 1000,
        txRate: 1000,
        rxRate: 2000,
        txBytes: 100000,
        rxBytes: 200000,
      },
      {
        timestamp: 2000,
        txRate: 1100,
        rxRate: 2100,
        txBytes: 110000,
        rxBytes: 210000,
      },
    ];

    const newPoint: BandwidthDataPoint = {
      timestamp: 3000,
      txRate: 1200,
      rxRate: 2200,
      txBytes: 120000,
      rxBytes: 220000,
    };

    it('should append new point', () => {
      const result = appendDataPoint(mockData, newPoint, 10);
      expect(result).toHaveLength(3);
      expect(result[2]).toEqual(newPoint);
    });

    it('should trim oldest point when exceeding max', () => {
      const result = appendDataPoint(mockData, newPoint, 2);
      expect(result).toHaveLength(2);
      expect(result[0].timestamp).toBe(2000); // First point removed
      expect(result[1]).toEqual(newPoint);
    });

    it('should not mutate original array', () => {
      const originalLength = mockData.length;
      appendDataPoint(mockData, newPoint, 10);
      expect(mockData).toHaveLength(originalLength);
    });
  });
});
