/**
 * Log Export Utilities
 * Provides CSV and JSON export functionality for log entries
 * Epic 0.8: System Logs - Export to CSV
 */

import type { LogEntry } from '@nasnet/core/types';

/**
 * Format log entries as CSV string
 */
export function logsToCSV(logs: LogEntry[]): string {
  const headers = ['Timestamp', 'Topic', 'Severity', 'Message'];
  const rows = logs.map((log) => [
    new Date(log.timestamp).toISOString(),
    log.topic,
    log.severity,
    // Escape quotes and wrap in quotes if contains comma
    `"${log.message.replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

/**
 * Format log entries as JSON string
 */
export function logsToJSON(logs: LogEntry[]): string {
  return JSON.stringify(
    logs.map((log) => ({
      timestamp: new Date(log.timestamp).toISOString(),
      topic: log.topic,
      severity: log.severity,
      message: log.message,
    })),
    null,
    2
  );
}

/**
 * Download content as file
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export logs to CSV file
 */
export function exportLogsToCSV(
  logs: LogEntry[],
  routerIp: string = 'router'
): void {
  const dateStr = new Date().toISOString().split('T')[0];
  const csv = logsToCSV(logs);
  downloadFile(csv, `logs-${routerIp}-${dateStr}.csv`, 'text/csv');
}

/**
 * Export logs to JSON file
 */
export function exportLogsToJSON(
  logs: LogEntry[],
  routerIp: string = 'router'
): void {
  const dateStr = new Date().toISOString().split('T')[0];
  const json = logsToJSON(logs);
  downloadFile(json, `logs-${routerIp}-${dateStr}.json`, 'application/json');
}




