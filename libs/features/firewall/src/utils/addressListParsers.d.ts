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
/**
 * Auto-detects format based on content
 * @description Analyzes file content to determine if it's CSV, JSON, TXT, or unknown format
 * @param content - Raw file content
 * @returns Detected format type
 */
export declare function detectFormat(content: string): 'csv' | 'json' | 'txt' | 'unknown';
/**
 * Parses CSV format
 * @description Supports:
 * - One IP per line: "192.168.1.1"
 * - IP with comment: "192.168.1.1,My comment"
 * - IP with comment and timeout: "192.168.1.1,My comment,1d"
 * @param content - CSV content string
 * @returns Parsed result with data and errors
 */
export declare function parseCSV(content: string): ParseResult;
/**
 * Parses JSON format
 * @description Expects array of objects: [{ address: "192.168.1.1", comment?: "...", timeout?: "1d" }]
 * @param content - JSON content string
 * @returns Parsed result with data and errors
 */
export declare function parseJSON(content: string): ParseResult;
/**
 * Parses TXT format (one IP per line)
 * @description Simple format with one IP address per line, comments starting with # or //
 * @param content - TXT content string
 * @returns Parsed result with data and errors
 */
export declare function parseTXT(content: string): ParseResult;
/**
 * Universal parser with auto-format detection
 * @description Parses address list content in CSV, JSON, or TXT format
 * @param content - Raw file content
 * @param format - Optional explicit format (auto-detected if omitted)
 * @returns Parsed result with data and errors
 */
export declare function parseAddressList(content: string, format?: 'csv' | 'json' | 'txt'): ParseResult;
/**
 * Batch validation helper for large imports
 * @description Validates entries in chunks to prevent UI blocking and provides progress updates
 * @param entries - Addresses to validate
 * @param batchSize - Size of each validation batch (default 100)
 * @param onProgress - Optional callback for progress updates (current, total)
 * @returns Promise resolving to parsed result with data and errors
 */
export declare function validateInBatches(entries: ParsedAddress[], batchSize?: number, onProgress?: (current: number, total: number) => void): Promise<ParseResult>;
//# sourceMappingURL=addressListParsers.d.ts.map