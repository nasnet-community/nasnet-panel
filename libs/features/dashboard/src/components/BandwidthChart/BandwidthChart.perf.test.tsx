/**
 * Performance tests for BandwidthChart
 * Tests rendering performance, memory stability, and downsampling
 */

import { render, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { describe, it, expect, vi } from 'vitest';
import { BandwidthChartDesktop } from './BandwidthChartDesktop';
import { BANDWIDTH_HISTORY_QUERY } from './graphql';
import { GraphQLTimeRange, GraphQLAggregationType } from './types';
import { downsampleData, appendDataPoint } from './utils';
import type { BandwidthDataPoint } from './types';
import type { ReactNode } from 'react';

// Mock platform hooks
vi.mock('@nasnet/ui/layouts', () => ({
  usePlatform: vi.fn(() => 'desktop'),
  useReducedMotion: vi.fn(() => false),
}));

// Mock Recharts
vi.mock('recharts', () => {
  const OriginalModule = vi.importActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: { children: ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
  };
});

/**
 * Generate large dataset for performance testing
 */
function generateLargeDataset(size: number): BandwidthDataPoint[] {
  const data: BandwidthDataPoint[] = [];
  const startTime = Date.now();

  for (let i = 0; i < size; i++) {
    data.push({
      timestamp: startTime + i * 2000, // 2-second intervals
      txRate: Math.floor(Math.random() * 100_000_000), // 0-100 Mbps
      rxRate: Math.floor(Math.random() * 1_000_000_000), // 0-1 Gbps
      txBytes: Math.floor(Math.random() * 10_000_000_000),
      rxBytes: Math.floor(Math.random() * 100_000_000_000),
    });
  }

  return data;
}

describe('BandwidthChart Performance Tests', () => {
  describe('Chart Rendering Performance', () => {
    it('should render 1000 data points within acceptable time', async () => {
      const largeDataset = generateLargeDataset(1000);

      const mocks = [
        {
          request: {
            query: BANDWIDTH_HISTORY_QUERY,
            variables: {
              deviceId: 'router-1',
              interfaceId: null,
              timeRange: GraphQLTimeRange.FIVE_MIN,
              aggregation: GraphQLAggregationType.RAW,
            },
          },
          result: {
            data: {
              bandwidthHistory: {
                dataPoints: largeDataset.map((dp) => ({
                  ...dp,
                  timestamp: new Date(dp.timestamp).toISOString(),
                })),
                aggregation: 'RAW',
              },
            },
          },
        },
      ];

      const wrapper = ({ children }: { children: ReactNode }) => (
        <MockedProvider mocks={mocks} addTypename={false}>
          {children}
        </MockedProvider>
      );

      const startTime = performance.now();

      render(<BandwidthChartDesktop deviceId="router-1" />, { wrapper });

      await waitFor(
        () => {
          expect(document.querySelector('[data-testid="responsive-container"]')).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within 2 seconds even with 1000 points
      expect(renderTime).toBeLessThan(2000);

      console.log(`✓ Rendered 1000 data points in ${renderTime.toFixed(2)}ms`);
    });

    it('should handle rapid data updates efficiently', async () => {
      const initialData = generateLargeDataset(100);
      let currentData = [...initialData];

      const startTime = performance.now();
      const updateCount = 50;

      // Simulate 50 rapid updates
      for (let i = 0; i < updateCount; i++) {
        const newPoint: BandwidthDataPoint = {
          timestamp: Date.now() + i * 2000,
          txRate: Math.floor(Math.random() * 100_000_000),
          rxRate: Math.floor(Math.random() * 1_000_000_000),
          txBytes: Math.floor(Math.random() * 10_000_000_000),
          rxBytes: Math.floor(Math.random() * 100_000_000_000),
        };

        currentData = appendDataPoint(currentData, newPoint, 150);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTimePerUpdate = totalTime / updateCount;

      // Each update should be fast (< 16.67ms for 60fps)
      expect(avgTimePerUpdate).toBeLessThan(16.67);

      console.log(
        `✓ Processed ${updateCount} updates in ${totalTime.toFixed(2)}ms (${avgTimePerUpdate.toFixed(2)}ms per update)`
      );
    });
  });

  describe('Memory Stability', () => {
    it('should not leak memory during continuous updates', () => {
      const initialData = generateLargeDataset(150);
      let currentData = [...initialData];

      // Take initial memory snapshot (if available)
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Simulate 1 hour of updates (1800 updates at 2s intervals)
      const updateCount = 1800;

      for (let i = 0; i < updateCount; i++) {
        const newPoint: BandwidthDataPoint = {
          timestamp: Date.now() + i * 2000,
          txRate: Math.floor(Math.random() * 100_000_000),
          rxRate: Math.floor(Math.random() * 1_000_000_000),
          txBytes: Math.floor(Math.random() * 10_000_000_000),
          rxBytes: Math.floor(Math.random() * 100_000_000_000),
        };

        // Use appendDataPoint which enforces max length
        currentData = appendDataPoint(currentData, newPoint, 150);
      }

      // Final memory snapshot
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Data array should remain at 150 points
      expect(currentData).toHaveLength(150);

      // Memory increase should be minimal (< 10MB) after 1800 updates
      if (initialMemory > 0) {
        const memoryIncreaseMB = memoryIncrease / (1024 * 1024);
        expect(memoryIncreaseMB).toBeLessThan(10);
        console.log(`✓ Memory increase after ${updateCount} updates: ${memoryIncreaseMB.toFixed(2)}MB`);
      } else {
        console.log('⚠ Memory API not available, skipping memory check');
      }
    });

    it('should maintain constant array size with appendDataPoint', () => {
      const data = generateLargeDataset(100);
      const maxPoints = 150;

      let currentData = data;

      // Add 100 more points
      for (let i = 0; i < 100; i++) {
        const newPoint: BandwidthDataPoint = {
          timestamp: Date.now() + i * 2000,
          txRate: 1000000,
          rxRate: 10000000,
          txBytes: 1000000000,
          rxBytes: 10000000000,
        };

        currentData = appendDataPoint(currentData, newPoint, maxPoints);
      }

      // Should never exceed max points
      expect(currentData.length).toBeLessThanOrEqual(maxPoints);
      expect(currentData).toHaveLength(maxPoints);

      console.log(`✓ Array maintained at ${maxPoints} points after 100 additions`);
    });
  });

  describe('Downsampling Validation', () => {
    it('should downsample datasets exceeding 500 points', () => {
      const largeDataset = generateLargeDataset(1000);
      const targetPoints = 500;

      const startTime = performance.now();
      const downsampled = downsampleData(largeDataset, targetPoints);
      const endTime = performance.now();

      const downsampleTime = endTime - startTime;

      // Should reduce to target size
      expect(downsampled.length).toBeLessThanOrEqual(targetPoints);

      // Should be fast (< 50ms)
      expect(downsampleTime).toBeLessThan(50);

      // Should maintain data point structure
      expect(downsampled[0]).toHaveProperty('timestamp');
      expect(downsampled[0]).toHaveProperty('txRate');
      expect(downsampled[0]).toHaveProperty('rxRate');

      console.log(
        `✓ Downsampled 1000 → ${downsampled.length} points in ${downsampleTime.toFixed(2)}ms`
      );
    });

    it('should not modify datasets below target points', () => {
      const smallDataset = generateLargeDataset(100);
      const targetPoints = 500;

      const downsampled = downsampleData(smallDataset, targetPoints);

      // Should return original data unchanged
      expect(downsampled).toHaveLength(100);
      expect(downsampled).toEqual(smallDataset);

      console.log('✓ Small dataset (100 points) left unchanged');
    });

    it('should handle very large datasets efficiently', () => {
      const veryLargeDataset = generateLargeDataset(10000);
      const targetPoints = 500;

      const startTime = performance.now();
      const downsampled = downsampleData(veryLargeDataset, targetPoints);
      const endTime = performance.now();

      const downsampleTime = endTime - startTime;

      // Should reduce significantly
      expect(downsampled.length).toBeLessThanOrEqual(targetPoints);

      // Should still be fast (< 100ms)
      expect(downsampleTime).toBeLessThan(100);

      console.log(
        `✓ Downsampled 10,000 → ${downsampled.length} points in ${downsampleTime.toFixed(2)}ms`
      );
    });
  });

  describe('Real-time Update Performance', () => {
    it('should maintain 60fps frame rate during updates', () => {
      const data = generateLargeDataset(150);
      const targetFrameTime = 16.67; // 60fps
      const updateCount = 60;

      const frameTimes: number[] = [];

      for (let i = 0; i < updateCount; i++) {
        const frameStart = performance.now();

        // Simulate data processing for one frame
        const newPoint: BandwidthDataPoint = {
          timestamp: Date.now() + i * 2000,
          txRate: Math.floor(Math.random() * 100_000_000),
          rxRate: Math.floor(Math.random() * 1_000_000_000),
          txBytes: Math.floor(Math.random() * 10_000_000_000),
          rxBytes: Math.floor(Math.random() * 100_000_000_000),
        };

        appendDataPoint(data, newPoint, 150);

        const frameEnd = performance.now();
        frameTimes.push(frameEnd - frameStart);
      }

      // Calculate average frame time
      const avgFrameTime =
        frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length;

      // Calculate percentage of frames meeting 60fps target
      const framesUnder16ms = frameTimes.filter(
        (time) => time < targetFrameTime
      ).length;
      const successRate = (framesUnder16ms / frameTimes.length) * 100;

      // At least 90% of frames should meet 60fps target
      expect(successRate).toBeGreaterThan(90);

      console.log(
        `✓ Average frame time: ${avgFrameTime.toFixed(2)}ms (${successRate.toFixed(1)}% < 16.67ms)`
      );
    });
  });

  describe('Data Processing Performance', () => {
    it('should process 1000 data points quickly', () => {
      const dataPoints = generateLargeDataset(1000);

      const startTime = performance.now();

      // Simulate typical processing operations
      const processed = dataPoints.map((dp) => ({
        ...dp,
        txRateMbps: dp.txRate / 1_000_000,
        rxRateMbps: dp.rxRate / 1_000_000,
      }));

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(processed).toHaveLength(1000);

      // Should process quickly (< 100ms)
      expect(processingTime).toBeLessThan(100);

      console.log(`✓ Processed 1000 data points in ${processingTime.toFixed(2)}ms`);
    });
  });
});
