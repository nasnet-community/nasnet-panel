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
export function formatCSV(entries: AddressListEntry[]): string {
  const lines = ['IP,Comment,Timeout']; // Header row

  entries.forEach((entry) => {
    const address = entry.address || '';
    const comment = entry.comment ? `"${entry.comment.replace(/"/g, '""')}"` : '';
    const timeout = entry.timeout || '';
    lines.push(`${address},${comment},${timeout}`);
  });

  return lines.join('\n');
}

/**
 * Formats address list entries as JSON
 * @description Format: Array of objects with address, comment, timeout
 * @param entries - Entries to format
 * @returns JSON string with 2-space indentation
 */
export function formatJSON(entries: AddressListEntry[]): string {
  const data = entries.map((entry) => ({
    address: entry.address,
    ...(entry.comment && { comment: entry.comment }),
    ...(entry.timeout && { timeout: entry.timeout }),
  }));

  return JSON.stringify(data, null, 2);
}

/**
 * Formats address list entries as RouterOS script (.rsc)
 * @description Format: /ip firewall address-list add commands with metadata comments
 * @param entries - Entries to format
 * @param listName - Name of the address list
 * @returns RouterOS script string ready for import
 */
export function formatRouterOSScript(entries: AddressListEntry[], listName: string): string {
  const lines = [
    '# RouterOS Script - Address List Import',
    `# List: ${listName}`,
    `# Generated: ${new Date().toISOString()}`,
    `# Entries: ${entries.length}`,
    '',
    '# Remove existing entries (optional - uncomment if needed)',
    `# /ip firewall address-list remove [find list="${listName}"]`,
    '',
    '# Add entries',
  ];

  entries.forEach((entry) => {
    const parts = [`list="${listName}"`, `address=${entry.address}`];

    if (entry.comment) {
      parts.push(`comment="${entry.comment.replace(/"/g, '\\"')}"`);
    }

    if (entry.timeout) {
      parts.push(`timeout=${entry.timeout}`);
    }

    lines.push(`/ip firewall address-list add ${parts.join(' ')}`);
  });

  return lines.join('\n');
}

/**
 * Universal formatter based on format type
 * @description Routes to appropriate formatter (CSV, JSON, RouterOS script)
 * @param entries - Entries to format
 * @param format - Export format (csv, json, routeros)
 * @param listName - Optional list name (required for RouterOS format)
 * @returns Formatted string in requested format
 * @throws Error if format is unsupported
 */
export function formatAddressList(
  entries: AddressListEntry[],
  format: ExportFormat,
  listName?: string
): string {
  switch (format) {
    case 'csv':
      return formatCSV(entries);
    case 'json':
      return formatJSON(entries);
    case 'routeros':
      return formatRouterOSScript(entries, listName || 'address-list');
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

/**
 * Gets the file extension for the export format
 * @description Returns appropriate file extension (csv, json, rsc)
 * @param format - Export format
 * @returns File extension without dot
 */
export function getFileExtension(format: ExportFormat): string {
  switch (format) {
    case 'csv':
      return 'csv';
    case 'json':
      return 'json';
    case 'routeros':
      return 'rsc';
    default:
      return 'txt';
  }
}

/**
 * Gets the MIME type for the export format
 * @description Returns appropriate MIME type for content negotiation
 * @param format - Export format
 * @returns MIME type string
 */
export function getMimeType(format: ExportFormat): string {
  switch (format) {
    case 'csv':
      return 'text/csv';
    case 'json':
      return 'application/json';
    case 'routeros':
      return 'text/plain';
    default:
      return 'text/plain';
  }
}

/**
 * Downloads formatted content as a file
 * @description Creates blob and triggers browser download with appropriate filename and MIME type
 * @param content - Formatted content to download
 * @param filename - Filename without extension
 * @param format - Export format (extension added automatically)
 */
export function downloadFile(content: string, filename: string, format: ExportFormat): void {
  const blob = new Blob([content], { type: getMimeType(format) });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.${getFileExtension(format)}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copies formatted content to clipboard
 * @description Uses modern Clipboard API with fallback for older browsers
 * @param content - Content to copy
 * @returns Promise resolving to success boolean
 */
export async function copyToClipboard(content: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(content);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    // Fallback for older browsers
    try {
      const textarea = document.createElement('textarea');
      textarea.value = content;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    } catch (fallbackError) {
      console.error('Fallback copy failed:', fallbackError);
      return false;
    }
  }
}

/**
 * Generates a filename for export based on list name and format
 * @description Creates sanitized filename with ISO date suffix (YYYY-MM-DD)
 * @param listName - Address list name (sanitized of special characters)
 * @param format - Export format (extension added separately)
 * @returns Filename without extension
 */
export function generateFilename(listName: string, format: ExportFormat): string {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const sanitizedListName = listName.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${sanitizedListName}_${timestamp}`;
}

/**
 * Formats file size for display
 * @description Converts bytes to human-readable format (B, KB, MB)
 * @param bytes - Number of bytes
 * @returns Formatted size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Estimates the size of formatted content
 * @description Calculates approximate file size after formatting
 * @param entries - Entries to estimate
 * @param format - Export format
 * @param listName - Optional list name (required for RouterOS format)
 * @returns Formatted size string (B, KB, or MB)
 */
export function estimateSize(
  entries: AddressListEntry[],
  format: ExportFormat,
  listName?: string
): string {
  const content = formatAddressList(entries, format, listName);
  const bytes = new Blob([content]).size;
  return formatFileSize(bytes);
}
