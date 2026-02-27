/**
 * useBulkCopy Hook
 *
 * Provides bulk copy functionality with format selection.
 * Supports copying multiple items as CSV, JSON, or plain text.
 *
 * @example
 * ```tsx
 * const { copyItems, format, setFormat, copied, supportedFormats } = useBulkCopy();
 *
 * // Copy selected items
 * await copyItems(selectedRows, ['name', 'ip', 'mac']);
 * ```
 *
 * @see NAS-4.23 - Implement Clipboard Integration
 */

import { useState, useCallback } from 'react';

import { useClipboard, CLIPBOARD_TIMEOUT_MS } from './useClipboard';

/**
 * Supported export formats
 */
export type ExportFormat = 'csv' | 'json' | 'text';

/**
 * Configuration options for useBulkCopy hook
 */
export interface UseBulkCopyOptions {
  /**
   * Default export format
   * @default 'csv'
   */
  defaultFormat?: ExportFormat;

  /**
   * Timeout for copied state
   * @default 2000
   */
  timeout?: number;

  /**
   * CSV delimiter
   * @default ','
   */
  csvDelimiter?: string;

  /**
   * Include header row in CSV
   * @default true
   */
  includeHeader?: boolean;

  /**
   * Text separator for plain text format
   * @default '\n'
   */
  textSeparator?: string;

  /**
   * JSON indentation spaces
   * @default 2
   */
  jsonIndent?: number;

  /**
   * Callback fired on successful copy
   */
  onSuccess?: (count: number, format: ExportFormat) => void;

  /**
   * Callback fired on copy failure
   */
  onError?: (error: Error) => void;
}

/**
 * Return type for useBulkCopy hook
 */
export interface UseBulkCopyReturn {
  /**
   * Copy multiple items to clipboard
   */
  copyItems: <T extends Record<string, unknown>>(
    items: T[],
    columns?: (keyof T)[]
  ) => Promise<boolean>;

  /**
   * Current export format
   */
  format: ExportFormat;

  /**
   * Set export format
   */
  setFormat: (format: ExportFormat) => void;

  /**
   * Whether content was recently copied
   */
  copied: boolean;

  /**
   * Number of items in last copy operation
   */
  copiedCount: number;

  /**
   * Error from last copy attempt, if any
   */
  error: Error | null;

  /**
   * Reset copied state
   */
  reset: () => void;

  /**
   * Whether a copy operation is in progress
   */
  isLoading: boolean;

  /**
   * List of supported export formats
   */
  supportedFormats: readonly ExportFormat[];
}

/**
 * All supported export formats
 */
export const SUPPORTED_FORMATS: readonly ExportFormat[] = ['csv', 'json', 'text'] as const;

/**
 * Format labels for display
 */
export const FORMAT_LABELS: Record<ExportFormat, string> = {
  csv: 'CSV',
  json: 'JSON',
  text: 'Plain Text',
};

/**
 * Convert items to CSV format
 */
function toCSV<T extends Record<string, unknown>>(
  items: T[],
  columns: (keyof T)[],
  delimiter: string,
  includeHeader: boolean
): string {
  const escapeCSVValue = (value: unknown): string => {
    const str = String(value ?? '');
    // Escape quotes and wrap in quotes if contains delimiter, quote, or newline
    if (str.includes(delimiter) || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines: string[] = [];

  if (includeHeader) {
    lines.push(columns.map((col) => escapeCSVValue(String(col))).join(delimiter));
  }

  for (const item of items) {
    const values = columns.map((col) => escapeCSVValue(item[col]));
    lines.push(values.join(delimiter));
  }

  return lines.join('\n');
}

/**
 * Convert items to JSON format
 */
function toJSON<T extends Record<string, unknown>>(
  items: T[],
  columns: (keyof T)[] | undefined,
  indent: number
): string {
  // If columns specified, filter to only those columns
  const data =
    columns ?
      items.map((item) => {
        const filtered: Record<string, unknown> = {};
        for (const col of columns) {
          filtered[String(col)] = item[col];
        }
        return filtered;
      })
    : items;

  return JSON.stringify(data, null, indent);
}

/**
 * Convert items to plain text format
 */
function toText<T extends Record<string, unknown>>(
  items: T[],
  columns: (keyof T)[],
  separator: string
): string {
  // For plain text, join column values with tab, rows with separator
  return items
    .map((item) => columns.map((col) => String(item[col] ?? '')).join('\t'))
    .join(separator);
}

/**
 * Hook for copying multiple items to clipboard with format selection
 *
 * Features:
 * - Multiple export formats: CSV, JSON, plain text
 * - Column selection
 * - Configurable CSV delimiter and header
 * - Success/error callbacks
 *
 * @param options - Configuration options
 * @returns Bulk copy utilities and state
 */
export function useBulkCopy(options: UseBulkCopyOptions = {}): UseBulkCopyReturn {
  const {
    defaultFormat = 'csv',
    timeout = CLIPBOARD_TIMEOUT_MS,
    csvDelimiter = ',',
    includeHeader = true,
    textSeparator = '\n',
    jsonIndent = 2,
    onSuccess,
    onError,
  } = options;

  const [format, setFormat] = useState<ExportFormat>(defaultFormat);
  const [copiedCount, setCopiedCount] = useState(0);

  const {
    copy,
    copied,
    error,
    reset: resetClipboard,
    isLoading,
  } = useClipboard({
    timeout,
    onError,
  });

  /**
   * Copy multiple items to clipboard in selected format
   */
  const copyItems = useCallback(
    async <T extends Record<string, unknown>>(
      items: T[],
      columns?: (keyof T)[]
    ): Promise<boolean> => {
      if (items.length === 0) {
        return false;
      }

      // Determine columns to use
      const cols = columns ?? (Object.keys(items[0]) as (keyof T)[]);

      let content: string;

      switch (format) {
        case 'csv':
          content = toCSV(items, cols, csvDelimiter, includeHeader);
          break;
        case 'json':
          content = toJSON(items, columns, jsonIndent);
          break;
        case 'text':
          content = toText(items, cols, textSeparator);
          break;
        default:
          content = toCSV(items, cols, csvDelimiter, includeHeader);
      }

      const success = await copy(content);

      if (success) {
        setCopiedCount(items.length);
        onSuccess?.(items.length, format);
      }

      return success;
    },
    [format, csvDelimiter, includeHeader, textSeparator, jsonIndent, copy, onSuccess]
  );

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    resetClipboard();
    setCopiedCount(0);
  }, [resetClipboard]);

  return {
    copyItems,
    format,
    setFormat,
    copied,
    copiedCount,
    error,
    reset,
    isLoading,
    supportedFormats: SUPPORTED_FORMATS,
  };
}
