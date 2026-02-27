/**
 * Address List Import Parsers
 * @description Supports CSV, JSON, and TXT formats with validation for IP addresses,
 * CIDR notation, IP ranges, and optional timeouts.
 * @module @nasnet/features/firewall/utils
 */

export interface ParsedAddress {
  /** IPv4 address, CIDR notation, or IP range */
  address: string;
  /** Optional comment describing the entry */
  comment?: string;
  /** Optional timeout in duration format (e.g., '1d', '12h', '30m') */
  timeout?: string;
}

export interface ParseResult {
  /** Whether parsing succeeded (no critical errors) */
  success: boolean;
  /** Successfully parsed addresses */
  data: ParsedAddress[];
  /** Validation errors encountered during parsing */
  errors: ParseError[];
}

export interface ParseError {
  /** Line number where error occurred (1-indexed) */
  line: number;
  /** Address that failed validation */
  address: string;
  /** Human-readable error message */
  message: string;
}

// ============================================
// VALIDATION PATTERNS
// ============================================

/** @description IPv4 address pattern (e.g., 192.168.1.1) */
const IPV4_PATTERN =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

/** @description CIDR notation pattern (e.g., 192.168.1.0/24) */
const CIDR_PATTERN =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:3[0-2]|[12]?[0-9])$/;

/** @description IP range pattern (e.g., 192.168.1.1-192.168.1.100) */
const IP_RANGE_PATTERN =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)-(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

/** @description Duration pattern for timeout (e.g., "1d", "12h", "30m", "60s") */
const DURATION_PATTERN = /^\d+[smhdw]$/;

/**
 * Validates IP address, CIDR notation, or IP range
 * @description Checks if value is valid IPv4, CIDR notation, or IP range format
 * @param address - Value to validate
 * @returns true if valid IP, CIDR, or range
 */
function validateAddress(address: string): boolean {
  const trimmed = address.trim();
  return IPV4_PATTERN.test(trimmed) || CIDR_PATTERN.test(trimmed) || IP_RANGE_PATTERN.test(trimmed);
}

/**
 * Validates timeout format
 * @description Checks if value is valid duration format (e.g., "1d", "12h", "30m")
 * @param timeout - Value to validate (optional)
 * @returns true if timeout is valid or undefined
 */
function validateTimeout(timeout: string | undefined): boolean {
  if (!timeout) return true;
  return DURATION_PATTERN.test(timeout.trim());
}

/**
 * Auto-detects format based on content
 * @description Analyzes file content to determine if it's CSV, JSON, TXT, or unknown format
 * @param content - Raw file content
 * @returns Detected format type
 */
export function detectFormat(content: string): 'csv' | 'json' | 'txt' | 'unknown' {
  const trimmed = content.trim();

  // JSON detection
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      // Not valid JSON, continue detection
    }
  }

  // CSV detection (has commas)
  const lines = trimmed.split('\n');
  const hasCommas = lines.some((line) => line.includes(','));
  if (hasCommas) {
    return 'csv';
  }

  // TXT detection (one IP per line)
  return 'txt';
}

/**
 * Parses CSV format
 * @description Supports:
 * - One IP per line: "192.168.1.1"
 * - IP with comment: "192.168.1.1,My comment"
 * - IP with comment and timeout: "192.168.1.1,My comment,1d"
 * @param content - CSV content string
 * @returns Parsed result with data and errors
 */
export function parseCSV(content: string): ParseResult {
  const data: ParsedAddress[] = [];
  const errors: ParseError[] = [];

  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    // Skip comments
    if (line.startsWith('#') || line.startsWith('//')) {
      return;
    }

    const parts = line.split(',').map((part) => part.trim());
    const address = parts[0];
    const comment = parts[1] || undefined;
    const timeout = parts[2] || undefined;

    // Validate address
    if (!validateAddress(address)) {
      errors.push({
        line: lineNumber,
        address,
        message:
          'Invalid IP format. Must be IPv4, CIDR (192.168.1.0/24), or range (192.168.1.1-192.168.1.100)',
      });
      return;
    }

    // Validate timeout if present
    if (timeout && !validateTimeout(timeout)) {
      errors.push({
        line: lineNumber,
        address,
        message: 'Invalid timeout format. Must be a valid duration (e.g., "1d", "12h", "30m")',
      });
      return;
    }

    // Validate comment length
    if (comment && comment.length > 200) {
      errors.push({
        line: lineNumber,
        address,
        message: 'Comment must be 200 characters or less',
      });
      return;
    }

    data.push({ address, comment, timeout });
  });

  return {
    success: errors.length === 0,
    data,
    errors,
  };
}

/**
 * Parses JSON format
 * @description Expects array of objects: [{ address: "192.168.1.1", comment?: "...", timeout?: "1d" }]
 * @param content - JSON content string
 * @returns Parsed result with data and errors
 */
export function parseJSON(content: string): ParseResult {
  const data: ParsedAddress[] = [];
  const errors: ParseError[] = [];

  try {
    const parsed = JSON.parse(content);

    if (!Array.isArray(parsed)) {
      errors.push({
        line: 0,
        address: '',
        message: 'JSON must be an array of address objects',
      });
      return { success: false, data, errors };
    }

    parsed.forEach((item, index) => {
      const lineNumber = index + 1;

      if (typeof item === 'string') {
        // Simple array of IP strings
        if (!validateAddress(item)) {
          errors.push({
            line: lineNumber,
            address: item,
            message: 'Invalid IP format',
          });
          return;
        }
        data.push({ address: item });
      } else if (typeof item === 'object' && item !== null) {
        // Object with address, comment, timeout
        const { address, comment, timeout } = item;

        if (!address || typeof address !== 'string') {
          errors.push({
            line: lineNumber,
            address: '',
            message: 'Missing or invalid address field',
          });
          return;
        }

        if (!validateAddress(address)) {
          errors.push({
            line: lineNumber,
            address,
            message: 'Invalid IP format',
          });
          return;
        }

        if (timeout && !validateTimeout(timeout)) {
          errors.push({
            line: lineNumber,
            address,
            message: 'Invalid timeout format',
          });
          return;
        }

        if (comment && typeof comment === 'string' && comment.length > 200) {
          errors.push({
            line: lineNumber,
            address,
            message: 'Comment must be 200 characters or less',
          });
          return;
        }

        data.push({
          address,
          comment: comment || undefined,
          timeout: timeout || undefined,
        });
      } else {
        errors.push({
          line: lineNumber,
          address: '',
          message: 'Invalid item format. Must be string or object with address field',
        });
      }
    });
  } catch (error) {
    errors.push({
      line: 0,
      address: '',
      message: `JSON parse error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    return { success: false, data, errors };
  }

  return {
    success: errors.length === 0,
    data,
    errors,
  };
}

/**
 * Parses TXT format (one IP per line)
 * @description Simple format with one IP address per line, comments starting with # or //
 * @param content - TXT content string
 * @returns Parsed result with data and errors
 */
export function parseTXT(content: string): ParseResult {
  const data: ParsedAddress[] = [];
  const errors: ParseError[] = [];

  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    // Skip comments
    if (line.startsWith('#') || line.startsWith('//')) {
      return;
    }

    if (!validateAddress(line)) {
      errors.push({
        line: lineNumber,
        address: line,
        message: 'Invalid IP format',
      });
      return;
    }

    data.push({ address: line });
  });

  return {
    success: errors.length === 0,
    data,
    errors,
  };
}

/**
 * Universal parser with auto-format detection
 * @description Parses address list content in CSV, JSON, or TXT format
 * @param content - Raw file content
 * @param format - Optional explicit format (auto-detected if omitted)
 * @returns Parsed result with data and errors
 */
export function parseAddressList(content: string, format?: 'csv' | 'json' | 'txt'): ParseResult {
  const detectedFormat = format || detectFormat(content);

  switch (detectedFormat) {
    case 'csv':
      return parseCSV(content);
    case 'json':
      return parseJSON(content);
    case 'txt':
      return parseTXT(content);
    default:
      return {
        success: false,
        data: [],
        errors: [
          {
            line: 0,
            address: '',
            message: 'Unable to detect format. Please specify CSV, JSON, or TXT',
          },
        ],
      };
  }
}

/**
 * Batch validation helper for large imports
 * @description Validates entries in chunks to prevent UI blocking and provides progress updates
 * @param entries - Addresses to validate
 * @param batchSize - Size of each validation batch (default 100)
 * @param onProgress - Optional callback for progress updates (current, total)
 * @returns Promise resolving to parsed result with data and errors
 */
export async function validateInBatches(
  entries: ParsedAddress[],
  batchSize = 100,
  onProgress?: (current: number, total: number) => void
): Promise<ParseResult> {
  const data: ParsedAddress[] = [];
  const errors: ParseError[] = [];

  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);

    batch.forEach((entry, batchIndex) => {
      const index = i + batchIndex;

      if (!validateAddress(entry.address)) {
        errors.push({
          line: index + 1,
          address: entry.address,
          message: 'Invalid IP format',
        });
      } else if (entry.timeout && !validateTimeout(entry.timeout)) {
        errors.push({
          line: index + 1,
          address: entry.address,
          message: 'Invalid timeout format',
        });
      } else if (entry.comment && entry.comment.length > 200) {
        errors.push({
          line: index + 1,
          address: entry.address,
          message: 'Comment too long',
        });
      } else {
        data.push(entry);
      }
    });

    if (onProgress) {
      onProgress(Math.min(i + batchSize, entries.length), entries.length);
    }

    // Allow UI to breathe
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  return {
    success: errors.length === 0,
    data,
    errors,
  };
}
