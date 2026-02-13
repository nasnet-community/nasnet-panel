/**
 * Address List Export Formatters
 * Supports CSV, JSON, and RouterOS script (.rsc) formats
 */

export interface AddressListEntry {
  address: string;
  comment?: string;
  timeout?: string;
  list?: string;
  creationTime?: string;
  dynamic?: boolean;
  disabled?: boolean;
}

export type ExportFormat = 'csv' | 'json' | 'routeros';

/**
 * Formats address list entries as CSV
 * Format: IP,comment,timeout
 */
export function formatCSV(entries: AddressListEntry[]): string {
  const lines = ['IP,Comment,Timeout']; // Header row

  entries.forEach(entry => {
    const address = entry.address || '';
    const comment = entry.comment ? `"${entry.comment.replace(/"/g, '""')}"` : '';
    const timeout = entry.timeout || '';
    lines.push(`${address},${comment},${timeout}`);
  });

  return lines.join('\n');
}

/**
 * Formats address list entries as JSON
 * Format: Array of objects with address, comment, timeout
 */
export function formatJSON(entries: AddressListEntry[]): string {
  const data = entries.map(entry => ({
    address: entry.address,
    ...(entry.comment && { comment: entry.comment }),
    ...(entry.timeout && { timeout: entry.timeout }),
  }));

  return JSON.stringify(data, null, 2);
}

/**
 * Formats address list entries as RouterOS script (.rsc)
 * Format: /ip firewall address-list add commands
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

  entries.forEach(entry => {
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
 */
export function downloadFile(
  content: string,
  filename: string,
  format: ExportFormat
): void {
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
 */
export function generateFilename(listName: string, format: ExportFormat): string {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const sanitizedListName = listName.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${sanitizedListName}_${timestamp}`;
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Estimates the size of formatted content
 */
export function estimateSize(entries: AddressListEntry[], format: ExportFormat, listName?: string): string {
  const content = formatAddressList(entries, format, listName);
  const bytes = new Blob([content]).size;
  return formatFileSize(bytes);
}
