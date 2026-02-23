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
    copyItems: <T extends Record<string, unknown>>(items: T[], columns?: (keyof T)[]) => Promise<boolean>;
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
export declare const SUPPORTED_FORMATS: readonly ExportFormat[];
/**
 * Format labels for display
 */
export declare const FORMAT_LABELS: Record<ExportFormat, string>;
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
export declare function useBulkCopy(options?: UseBulkCopyOptions): UseBulkCopyReturn;
//# sourceMappingURL=useBulkCopy.d.ts.map