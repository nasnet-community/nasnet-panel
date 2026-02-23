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
export declare function usePasteImport(options?: UsePasteImportOptions): UsePasteImportReturn;
//# sourceMappingURL=usePasteImport.d.ts.map