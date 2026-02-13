/**
 * Address List Import Parsers
 * Supports CSV, JSON, and TXT formats with validation
 */

export interface ParsedAddress {
  address: string;
  comment?: string;
  timeout?: string;
}

export interface ParseResult {
  success: boolean;
  data: ParsedAddress[];
  errors: ParseError[];
}

export interface ParseError {
  line: number;
  address: string;
  message: string;
}

// Validation patterns
const ipv4Pattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const cidrPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:3[0-2]|[12]?[0-9])$/;
const ipRangePattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)-(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const durationPattern = /^\d+[smhdw]$/;

/**
 * Validates IP address, CIDR notation, or IP range
 */
function validateAddress(address: string): boolean {
  const trimmed = address.trim();
  return ipv4Pattern.test(trimmed) || cidrPattern.test(trimmed) || ipRangePattern.test(trimmed);
}

/**
 * Validates timeout format (e.g., "1d", "12h", "30m")
 */
function validateTimeout(timeout: string | undefined): boolean {
  if (!timeout) return true;
  return durationPattern.test(timeout.trim());
}

/**
 * Auto-detects format based on content
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
  const hasCommas = lines.some(line => line.includes(','));
  if (hasCommas) {
    return 'csv';
  }

  // TXT detection (one IP per line)
  return 'txt';
}

/**
 * Parses CSV format
 * Supports:
 * - One IP per line: "192.168.1.1"
 * - IP with comment: "192.168.1.1,My comment"
 * - IP with comment and timeout: "192.168.1.1,My comment,1d"
 */
export function parseCSV(content: string): ParseResult {
  const data: ParsedAddress[] = [];
  const errors: ParseError[] = [];

  const lines = content.split('\n').map(line => line.trim()).filter(Boolean);

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    // Skip comments
    if (line.startsWith('#') || line.startsWith('//')) {
      return;
    }

    const parts = line.split(',').map(part => part.trim());
    const address = parts[0];
    const comment = parts[1] || undefined;
    const timeout = parts[2] || undefined;

    // Validate address
    if (!validateAddress(address)) {
      errors.push({
        line: lineNumber,
        address,
        message: 'Invalid IP format. Must be IPv4, CIDR (192.168.1.0/24), or range (192.168.1.1-192.168.1.100)',
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
 * Expects array of objects: [{ address: "192.168.1.1", comment?: "...", timeout?: "1d" }]
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
 */
export function parseTXT(content: string): ParseResult {
  const data: ParsedAddress[] = [];
  const errors: ParseError[] = [];

  const lines = content.split('\n').map(line => line.trim()).filter(Boolean);

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
        errors: [{
          line: 0,
          address: '',
          message: 'Unable to detect format. Please specify CSV, JSON, or TXT',
        }],
      };
  }
}

/**
 * Batch validation helper for large imports
 * Validates entries in chunks to prevent UI blocking
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
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  return {
    success: errors.length === 0,
    data,
    errors,
  };
}
