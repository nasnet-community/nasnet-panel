/**
 * usePasteImport Hook
 *
 * Provides paste detection and validation for importing data.
 * Supports parsing IP lists, CSV data, and RouterOS configurations.
 *
 * @example
 * ```tsx
 * const { handlePaste, parseResult, clearResult, isParsing } = usePasteImport({
 *   type: 'ip-list',
 *   onParsed: (result) => setPreviewData(result),
 * });
 *
 * <textarea onPaste={handlePaste} />
 * ```
 *
 * @see NAS-4.23 - Implement Clipboard Integration
 */

import { useState, useCallback } from 'react';

/**
 * Supported import types
 */
export type ImportType = 'ip-list' | 'csv' | 'routeros' | 'auto';

/**
 * Validation error for a specific line/item
 */
export interface ValidationError {
  /**
   * Line number (1-based)
   */
  line: number;

  /**
   * Error message
   */
  message: string;

  /**
   * The problematic content
   */
  content: string;
}

/**
 * Successfully parsed item
 */
export interface ParsedItem {
  /**
   * Line number (1-based)
   */
  line: number;

  /**
   * Original content
   */
  original: string;

  /**
   * Parsed/validated value
   */
  value: string | Record<string, string>;
}

/**
 * Parse result from import operation
 */
export interface ParseResult {
  /**
   * Whether parsing was successful (no errors)
   */
  success: boolean;

  /**
   * Detected or specified import type
   */
  type: ImportType;

  /**
   * Successfully parsed items
   */
  items: ParsedItem[];

  /**
   * Validation errors
   */
  errors: ValidationError[];

  /**
   * Total number of lines processed
   */
  totalLines: number;

  /**
   * Original pasted content
   */
  rawContent: string;
}

/**
 * Configuration options for usePasteImport hook
 */
export interface UsePasteImportOptions {
  /**
   * Expected import type
   * @default 'auto' (auto-detect)
   */
  type?: ImportType;

  /**
   * Maximum number of items to parse
   * @default 1000
   */
  maxItems?: number;

  /**
   * CSV delimiter for CSV parsing
   * @default ','
   */
  csvDelimiter?: string;

  /**
   * Expected CSV columns (validates header if provided)
   */
  csvColumns?: string[];

  /**
   * Callback fired when content is parsed
   */
  onParsed?: (result: ParseResult) => void;

  /**
   * Callback fired on parse error
   */
  onError?: (error: Error) => void;
}

/**
 * Return type for usePasteImport hook
 */
export interface UsePasteImportReturn {
  /**
   * Handle paste event on an element
   */
  handlePaste: (event: React.ClipboardEvent) => void;

  /**
   * Parse content directly
   */
  parseContent: (content: string) => ParseResult;

  /**
   * Current parse result
   */
  parseResult: ParseResult | null;

  /**
   * Clear the parse result
   */
  clearResult: () => void;

  /**
   * Whether parsing is in progress
   */
  isParsing: boolean;
}

/**
 * IPv4 address regex (with optional CIDR notation)
 */
const IPV4_REGEX =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\/(?:3[0-2]|[12]?[0-9]))?$/;

/**
 * IPv6 address regex (simplified)
 */
const IPV6_REGEX =
  /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::(?:[0-9a-fA-F]{1,4}:){0,5}[0-9a-fA-F]{1,4}$/;

/**
 * Validate IP address (v4 or v6)
 */
function isValidIP(value: string): boolean {
  return IPV4_REGEX.test(value) || IPV6_REGEX.test(value);
}

/**
 * Detect import type from content
 */
function detectImportType(content: string): ImportType {
  const lines = content.trim().split('\n');
  const firstLine = lines[0]?.trim() ?? '';

  // Check for RouterOS commands
  if (firstLine.startsWith('/') || firstLine.includes('add chain=')) {
    return 'routeros';
  }

  // Check for CSV (has comma or tab in header line)
  if (firstLine.includes(',') || firstLine.includes('\t')) {
    return 'csv';
  }

  // Check if all non-empty lines look like IPs
  const nonEmptyLines = lines.filter((l) => l.trim());
  const allIPs = nonEmptyLines.every((line) => isValidIP(line.trim()));
  if (allIPs && nonEmptyLines.length > 0) {
    return 'ip-list';
  }

  return 'auto';
}

/**
 * Parse IP list
 */
function parseIPList(content: string, maxItems: number): ParseResult {
  const lines = content.split('\n');
  const items: ParsedItem[] = [];
  const errors: ValidationError[] = [];

  for (let i = 0; i < lines.length && items.length < maxItems; i++) {
    const line = lines[i].trim();
    const lineNum = i + 1;

    // Skip empty lines and comments
    if (!line || line.startsWith('#')) {
      continue;
    }

    if (isValidIP(line)) {
      items.push({ line: lineNum, original: line, value: line });
    } else {
      errors.push({ line: lineNum, message: 'Invalid IP address', content: line });
    }
  }

  return {
    success: errors.length === 0,
    type: 'ip-list',
    items,
    errors,
    totalLines: lines.length,
    rawContent: content,
  };
}

/**
 * Parse CSV content
 */
function parseCSV(
  content: string,
  delimiter: string,
  expectedColumns: string[] | undefined,
  maxItems: number
): ParseResult {
  const lines = content.split('\n');
  const items: ParsedItem[] = [];
  const errors: ValidationError[] = [];

  if (lines.length === 0) {
    return {
      success: false,
      type: 'csv',
      items: [],
      errors: [{ line: 1, message: 'Empty content', content: '' }],
      totalLines: 0,
      rawContent: content,
    };
  }

  // Parse header
  const headerLine = lines[0];
  const headers = headerLine.split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ''));

  // Validate header if expected columns provided
  if (expectedColumns) {
    const missingColumns = expectedColumns.filter((col) => !headers.includes(col));
    if (missingColumns.length > 0) {
      errors.push({
        line: 1,
        message: `Missing columns: ${missingColumns.join(', ')}`,
        content: headerLine,
      });
    }
  }

  // Parse data rows
  for (let i = 1; i < lines.length && items.length < maxItems; i++) {
    const line = lines[i].trim();
    const lineNum = i + 1;

    if (!line) continue;

    const values = line.split(delimiter).map((v) => v.trim().replace(/^"|"$/g, ''));

    if (values.length !== headers.length) {
      errors.push({
        line: lineNum,
        message: `Expected ${headers.length} columns, got ${values.length}`,
        content: line,
      });
      continue;
    }

    const record: Record<string, string> = {};
    headers.forEach((header, idx) => {
      record[header] = values[idx];
    });

    items.push({ line: lineNum, original: line, value: record });
  }

  return {
    success: errors.length === 0,
    type: 'csv',
    items,
    errors,
    totalLines: lines.length,
    rawContent: content,
  };
}

/**
 * Parse RouterOS configuration
 */
function parseRouterOS(content: string, maxItems: number): ParseResult {
  const lines = content.split('\n');
  const items: ParsedItem[] = [];
  const errors: ValidationError[] = [];

  let currentCommand = '';

  for (let i = 0; i < lines.length && items.length < maxItems; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    // Handle line continuation (backslash at end)
    if (trimmed.endsWith('\\')) {
      currentCommand += trimmed.slice(0, -1) + ' ';
      continue;
    }

    const fullCommand = currentCommand + trimmed;
    currentCommand = '';

    // Validate command structure (basic check)
    if (
      fullCommand.startsWith('/') ||
      fullCommand.includes(' add ') ||
      fullCommand.includes(' set ')
    ) {
      items.push({ line: lineNum, original: fullCommand, value: fullCommand });
    } else {
      errors.push({
        line: lineNum,
        message: 'Invalid RouterOS command format',
        content: fullCommand,
      });
    }
  }

  // Handle incomplete command
  if (currentCommand) {
    errors.push({
      line: lines.length,
      message: 'Incomplete command (trailing backslash)',
      content: currentCommand,
    });
  }

  return {
    success: errors.length === 0,
    type: 'routeros',
    items,
    errors,
    totalLines: lines.length,
    rawContent: content,
  };
}

/**
 * Hook for handling paste import with validation
 *
 * Features:
 * - Auto-detection of import type
 * - Support for IP lists, CSV, and RouterOS configs
 * - Line-by-line validation with error messages
 * - Maximum items limit
 *
 * @param options - Configuration options
 * @returns Paste import utilities and state
 */
export function usePasteImport(options: UsePasteImportOptions = {}): UsePasteImportReturn {
  const {
    type = 'auto',
    maxItems = 1000,
    csvDelimiter = ',',
    csvColumns,
    onParsed,
    onError,
  } = options;

  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  /**
   * Parse content and return result
   */
  const parseContent = useCallback(
    (content: string): ParseResult => {
      const trimmedContent = content.trim();

      if (!trimmedContent) {
        return {
          success: false,
          type: 'auto',
          items: [],
          errors: [{ line: 1, message: 'Empty content', content: '' }],
          totalLines: 0,
          rawContent: content,
        };
      }

      // Detect type if auto
      const detectedType = type === 'auto' ? detectImportType(trimmedContent) : type;

      let result: ParseResult;

      switch (detectedType) {
        case 'ip-list':
          result = parseIPList(trimmedContent, maxItems);
          break;
        case 'csv':
          result = parseCSV(trimmedContent, csvDelimiter, csvColumns, maxItems);
          break;
        case 'routeros':
          result = parseRouterOS(trimmedContent, maxItems);
          break;
        default:
          // For unknown type, try IP list first
          result = parseIPList(trimmedContent, maxItems);
          if (result.errors.length > 0 && result.items.length === 0) {
            // Fall back to treating as text lines
            result = {
              success: true,
              type: 'auto',
              items: trimmedContent.split('\n').map((line, i) => ({
                line: i + 1,
                original: line,
                value: line.trim(),
              })),
              errors: [],
              totalLines: trimmedContent.split('\n').length,
              rawContent: content,
            };
          }
      }

      return result;
    },
    [type, maxItems, csvDelimiter, csvColumns]
  );

  /**
   * Handle paste event
   */
  const handlePaste = useCallback(
    (event: React.ClipboardEvent) => {
      const pastedText = event.clipboardData.getData('text');

      if (!pastedText) return;

      setIsParsing(true);

      try {
        const result = parseContent(pastedText);
        setParseResult(result);
        onParsed?.(result);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Parse failed');
        onError?.(error);
      } finally {
        setIsParsing(false);
      }
    },
    [parseContent, onParsed, onError]
  );

  /**
   * Clear parse result
   */
  const clearResult = useCallback(() => {
    setParseResult(null);
  }, []);

  return {
    handlePaste,
    parseContent,
    parseResult,
    clearResult,
    isParsing,
  };
}
