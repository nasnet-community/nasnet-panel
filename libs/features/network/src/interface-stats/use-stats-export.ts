/**
 * useStatsExport Hook
 * Data export functionality for interface statistics
 *
 * NAS-6.9: Implement Interface Traffic Statistics (Task 7 - AC5)
 */

import { useCallback, type RefObject } from 'react';
import type { StatsDataPoint, StatsTimeRangeInput } from '@nasnet/api-client/generated';

/**
 * Options for useStatsExport hook
 */
export interface UseStatsExportOptions {
  /** Interface ID (technical identifier) */
  interfaceId: string;
  /** Interface display name */
  interfaceName: string;
}

// Constants
const EXPORT_DATE_FORMAT_LENGTH = 16;
const EXPORT_PNG_PIXEL_RATIO = 2;
const EXPORT_BG_COLOR_WHITE = '#ffffff';

/**
 * Formats date for safe filename usage
 * Converts "2024-01-15T10:30:00.000Z" to "2024-01-15_1030"
 *
 * @internal Used internally for filename formatting
 */
function formatDateForFilename(date: string): string {
  const cleaned = date.replace(/[:.]/g, '-').slice(0, EXPORT_DATE_FORMAT_LENGTH);
  return cleaned.replace('T', '_');
}

/**
 * Triggers browser download of file
 *
 * @internal Used internally for download functionality
 */
function downloadFile(content: string | Blob, filename: string, mimeType: string): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * useStatsExport Hook
 *
 * Provides methods to export interface statistics data in multiple formats:
 * - CSV: Spreadsheet-compatible format
 * - JSON: Structured data with metadata
 * - PNG: Chart screenshot
 *
 * @example
 * ```tsx
 * const { exportCsv, exportJson, exportPng } = useStatsExport({
 *   interfaceId: 'ether1',
 *   interfaceName: 'ether1 - WAN',
 * });
 *
 * const chartRef = useRef<HTMLDivElement>(null);
 *
 * <BandwidthChart ref={chartRef} ... />
 *
 * <button onClick={() => exportCsv(data.dataPoints, timeRange)}>
 *   Export CSV
 * </button>
 * <button onClick={() => exportPng(chartRef)}>
 *   Export Chart
 * </button>
 * ```
 */
export function useStatsExport({ interfaceId, interfaceName }: UseStatsExportOptions) {
  /**
   * Export data as CSV format
   *
   * Creates a CSV file with headers and data rows suitable for Excel/Google Sheets.
   * Filename includes interface name and date range.
   *
   * @param data - Array of stats data points
   * @param timeRange - Time range input for filename
   */
  const exportCsv = useCallback(
    (data: StatsDataPoint[], timeRange: StatsTimeRangeInput) => {
      const headers = [
        'Timestamp',
        'TX Bytes/s',
        'RX Bytes/s',
        'TX Packets/s',
        'RX Packets/s',
        'TX Errors',
        'RX Errors',
      ];

      const rows = data.map((point) => [
        new Date(point.timestamp).toISOString(),
        point.txBytesPerSec.toString(),
        point.rxBytesPerSec.toString(),
        point.txPacketsPerSec.toString(),
        point.rxPacketsPerSec.toString(),
        point.txErrors.toString(),
        point.rxErrors.toString(),
      ]);

      const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

      const startDate = formatDateForFilename(timeRange.start);
      const endDate = formatDateForFilename(timeRange.end);
      const filename = `${interfaceName}-stats-${startDate}-to-${endDate}.csv`;

      downloadFile(csv, filename, 'text/csv;charset=utf-8;');
    },
    [interfaceName]
  );

  /**
   * Export data as JSON format
   *
   * Creates a structured JSON file with metadata (interface info, export time).
   * Includes all data points with proper formatting.
   *
   * @param data - Array of stats data points
   * @param timeRange - Time range input for metadata
   */
  const exportJson = useCallback(
    (data: StatsDataPoint[], timeRange: StatsTimeRangeInput) => {
      const exportData = {
        interfaceId,
        interfaceName,
        timeRange: {
          start: timeRange.start,
          end: timeRange.end,
        },
        exportedAt: new Date().toISOString(),
        dataPointCount: data.length,
        dataPoints: data.map((point) => ({
          timestamp: point.timestamp,
          txBytesPerSec: point.txBytesPerSec,
          rxBytesPerSec: point.rxBytesPerSec,
          txPacketsPerSec: point.txPacketsPerSec,
          rxPacketsPerSec: point.rxPacketsPerSec,
          txErrors: point.txErrors,
          rxErrors: point.rxErrors,
        })),
      };

      const json = JSON.stringify(exportData, null, 2);

      const startDate = formatDateForFilename(timeRange.start);
      const endDate = formatDateForFilename(timeRange.end);
      const filename = `${interfaceName}-stats-${startDate}-to-${endDate}.json`;

      downloadFile(json, filename, 'application/json;charset=utf-8;');
    },
    [interfaceId, interfaceName]
  );

  /**
   * Export chart as PNG image
   *
   * Takes a screenshot of the bandwidth chart and downloads as PNG.
   * Uses html-to-image library (dynamic import to reduce bundle size).
   *
   * @param chartRef - React ref to the chart container element
   * @throws Error if PNG export fails
   */
  const exportPng = useCallback(
    async (chartRef: RefObject<HTMLDivElement>) => {
      if (!chartRef.current) {
        console.warn('Chart reference not available for PNG export');
        return;
      }

      try {
        // Dynamic import to reduce bundle size
        const { toPng } = await import('html-to-image');

        const dataUrl = await toPng(chartRef.current, {
          backgroundColor: EXPORT_BG_COLOR_WHITE,
          pixelRatio: EXPORT_PNG_PIXEL_RATIO,
        });

        const filename = `${interfaceName}-bandwidth-chart.png`;

        // Convert data URL to blob and download
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        downloadFile(blob, filename, 'image/png');
      } catch (error) {
        console.error('PNG export failed:', error);
        throw new Error('Failed to export chart as PNG. Please try again.');
      }
    },
    [interfaceName]
  );

  return {
    exportCsv,
    exportJson,
    exportPng,
  };
}
