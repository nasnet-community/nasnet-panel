/**
 * Address List Export Formatters
 * @description Supports CSV, JSON, and RouterOS script (.rsc) formats
 * for address list entry export and download
 * @module @nasnet/features/firewall/utils
 */
export interface AddressListEntry {
    /** IPv4 address, CIDR notation, or IP range (use font-mono in UI) */
    address: string;
    /** Optional comment describing the entry */
    comment?: string;
    /** Optional timeout in duration format (e.g., '1d', '12h', '30m') */
    timeout?: string;
    /** Address list name this entry belongs to */
    list?: string;
    /** ISO timestamp of when entry was created */
    creationTime?: string;
    /** Whether entry is dynamically generated */
    dynamic?: boolean;
    /** Whether entry is disabled */
    disabled?: boolean;
}
export type ExportFormat = 'csv' | 'json' | 'routeros';
/**
 * Formats address list entries as CSV
 * @description Format: IP,comment,timeout with header row
 * @param entries - Entries to format
 * @returns CSV string ready for download or display
 */
export declare function formatCSV(entries: AddressListEntry[]): string;
/**
 * Formats address list entries as JSON
 * @description Format: Array of objects with address, comment, timeout
 * @param entries - Entries to format
 * @returns JSON string with 2-space indentation
 */
export declare function formatJSON(entries: AddressListEntry[]): string;
/**
 * Formats address list entries as RouterOS script (.rsc)
 * @description Format: /ip firewall address-list add commands with metadata comments
 * @param entries - Entries to format
 * @param listName - Name of the address list
 * @returns RouterOS script string ready for import
 */
export declare function formatRouterOSScript(entries: AddressListEntry[], listName: string): string;
/**
 * Universal formatter based on format type
 * @description Routes to appropriate formatter (CSV, JSON, RouterOS script)
 * @param entries - Entries to format
 * @param format - Export format (csv, json, routeros)
 * @param listName - Optional list name (required for RouterOS format)
 * @returns Formatted string in requested format
 * @throws Error if format is unsupported
 */
export declare function formatAddressList(entries: AddressListEntry[], format: ExportFormat, listName?: string): string;
/**
 * Gets the file extension for the export format
 * @description Returns appropriate file extension (csv, json, rsc)
 * @param format - Export format
 * @returns File extension without dot
 */
export declare function getFileExtension(format: ExportFormat): string;
/**
 * Gets the MIME type for the export format
 * @description Returns appropriate MIME type for content negotiation
 * @param format - Export format
 * @returns MIME type string
 */
export declare function getMimeType(format: ExportFormat): string;
/**
 * Downloads formatted content as a file
 * @description Creates blob and triggers browser download with appropriate filename and MIME type
 * @param content - Formatted content to download
 * @param filename - Filename without extension
 * @param format - Export format (extension added automatically)
 */
export declare function downloadFile(content: string, filename: string, format: ExportFormat): void;
/**
 * Copies formatted content to clipboard
 * @description Uses modern Clipboard API with fallback for older browsers
 * @param content - Content to copy
 * @returns Promise resolving to success boolean
 */
export declare function copyToClipboard(content: string): Promise<boolean>;
/**
 * Generates a filename for export based on list name and format
 * @description Creates sanitized filename with ISO date suffix (YYYY-MM-DD)
 * @param listName - Address list name (sanitized of special characters)
 * @param format - Export format (extension added separately)
 * @returns Filename without extension
 */
export declare function generateFilename(listName: string, format: ExportFormat): string;
/**
 * Formats file size for display
 * @description Converts bytes to human-readable format (B, KB, MB)
 * @param bytes - Number of bytes
 * @returns Formatted size string
 */
export declare function formatFileSize(bytes: number): string;
/**
 * Estimates the size of formatted content
 * @description Calculates approximate file size after formatting
 * @param entries - Entries to estimate
 * @param format - Export format
 * @param listName - Optional list name (required for RouterOS format)
 * @returns Formatted size string (B, KB, or MB)
 */
export declare function estimateSize(entries: AddressListEntry[], format: ExportFormat, listName?: string): string;
//# sourceMappingURL=addressListFormatters.d.ts.map