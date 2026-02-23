/**
 * Log Export Utilities
 *
 * Provides CSV and JSON export functionality for log entries.
 * Epic 0.8: System Logs - Export to CSV
 *
 * @module @nasnet/core/utils/log-export
 */
import type { LogEntry } from '@nasnet/core/types';
/**
 * Format log entries as CSV string
 *
 * Converts an array of log entries into a CSV-formatted string with
 * headers (Timestamp, Topic, Severity, Message). Message values are
 * quoted and internal quotes are escaped.
 *
 * @param logs - Array of log entries to format
 * @returns CSV-formatted string with newline-separated rows
 *
 * @example
 * ```ts
 * const logs = [
 *   {
 *     timestamp: new Date('2024-01-01').getTime(),
 *     topic: 'system',
 *     severity: 'info',
 *     message: 'System started',
 *   },
 * ];
 *
 * const csv = logsToCSV(logs);
 * // "Timestamp,Topic,Severity,Message\n2024-01-01T00:00:00.000Z,system,info,\"System started\""
 * ```
 */
export declare function logsToCSV(logs: LogEntry[]): string;
/**
 * Format log entries as JSON string
 *
 * Converts an array of log entries into a formatted JSON string with
 * proper indentation (2 spaces). Timestamps are converted to ISO format.
 *
 * @param logs - Array of log entries to format
 * @returns JSON-formatted string with indentation
 *
 * @example
 * ```ts
 * const logs = [
 *   {
 *     timestamp: new Date('2024-01-01').getTime(),
 *     topic: 'system',
 *     severity: 'info',
 *     message: 'System started',
 *   },
 * ];
 *
 * const json = logsToJSON(logs);
 * // "[\n  {\n    \"timestamp\": \"2024-01-01T00:00:00.000Z\",\n    ...\n  }\n]"
 * ```
 */
export declare function logsToJSON(logs: LogEntry[]): string;
/**
 * Download content as file
 *
 * Creates a Blob from content and triggers a download in the browser.
 * Automatically cleans up the object URL after download completes.
 *
 * @param content - String content to download
 * @param filename - Name for the downloaded file
 * @param mimeType - MIME type for the Blob (e.g., 'text/csv', 'application/json')
 *
 * @example
 * ```ts
 * downloadFile('a,b,c\n1,2,3', 'data.csv', 'text/csv');
 * ```
 */
export declare function downloadFile(content: string, filename: string, mimeType: string): void;
/**
 * Export logs to CSV file
 *
 * Formats logs as CSV and initiates a browser download with a timestamped filename.
 * Filename format: logs-{routerIp}-{YYYY-MM-DD}.csv
 *
 * @param logs - Array of log entries to export
 * @param routerIp - IP address or identifier for the router (used in filename)
 *
 * @example
 * ```ts
 * const logs = [{ timestamp, topic, severity, message }];
 * exportLogsToCSV(logs, '192.168.1.1');
 * // Downloads: logs-192.168.1.1-2024-01-01.csv
 * ```
 */
export declare function exportLogsToCSV(logs: LogEntry[], routerIp?: string): void;
/**
 * Export logs to JSON file
 *
 * Formats logs as JSON and initiates a browser download with a timestamped filename.
 * Filename format: logs-{routerIp}-{YYYY-MM-DD}.json
 *
 * @param logs - Array of log entries to export
 * @param routerIp - IP address or identifier for the router (used in filename)
 *
 * @example
 * ```ts
 * const logs = [{ timestamp, topic, severity, message }];
 * exportLogsToJSON(logs, '192.168.1.1');
 * // Downloads: logs-192.168.1.1-2024-01-01.json
 * ```
 */
export declare function exportLogsToJSON(logs: LogEntry[], routerIp?: string): void;
//# sourceMappingURL=log-export.d.ts.map