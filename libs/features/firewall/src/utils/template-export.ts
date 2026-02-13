/**
 * Template Export Utility
 *
 * Export firewall templates to JSON or YAML format with download helpers.
 * Handles sanitization, formatting, and browser download.
 *
 * @module @nasnet/features/firewall/utils
 */

import yaml from 'js-yaml';
import type { FirewallTemplate } from '../schemas/templateSchemas';
import { sanitizeTemplateForExport } from './template-validator';

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * Export format type
 */
export type ExportFormat = 'json' | 'yaml';

/**
 * Export options
 */
export interface ExportOptions {
  /** Whether to pretty-print JSON (default: true) */
  prettify?: boolean;
  /** Indent size for JSON (default: 2) */
  indent?: number;
  /** Whether to sanitize internal fields (default: true) */
  sanitize?: boolean;
  /** File name without extension (default: template.name) */
  fileName?: string;
}

/**
 * Export result
 */
export interface ExportResult {
  /** Exported content as string */
  content: string;
  /** MIME type */
  mimeType: string;
  /** Suggested file name */
  fileName: string;
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

/**
 * Export template to JSON string
 *
 * @param template - Template to export
 * @param options - Export options
 * @returns JSON string
 *
 * @example
 * ```ts
 * const json = exportTemplateToJSON(template, { prettify: true });
 * console.log(json);
 * ```
 */
export function exportTemplateToJSON(template: FirewallTemplate, options: ExportOptions = {}): string {
  const { prettify = true, indent = 2, sanitize = true } = options;

  const data = sanitize ? sanitizeTemplateForExport(template) : template;

  if (prettify) {
    return JSON.stringify(data, null, indent);
  }

  return JSON.stringify(data);
}

/**
 * Export template to YAML string
 *
 * @param template - Template to export
 * @param options - Export options
 * @returns YAML string
 *
 * @example
 * ```ts
 * const yamlContent = exportTemplateToYAML(template);
 * console.log(yamlContent);
 * ```
 */
export function exportTemplateToYAML(template: FirewallTemplate, options: ExportOptions = {}): string {
  const { sanitize = true, indent = 2 } = options;

  const data = sanitize ? sanitizeTemplateForExport(template) : template;

  return yaml.dump(data, {
    indent,
    lineWidth: 120,
    noRefs: true,
    sortKeys: false,
  });
}

/**
 * Export template to specified format
 *
 * @param template - Template to export
 * @param format - Export format
 * @param options - Export options
 * @returns Export result with content and metadata
 *
 * @example
 * ```ts
 * const result = exportTemplate(template, 'json');
 * console.log(result.content);
 * console.log(result.fileName); // "basic-security.json"
 * ```
 */
export function exportTemplate(
  template: FirewallTemplate,
  format: ExportFormat,
  options: ExportOptions = {}
): ExportResult {
  const fileName = options.fileName || template.name.toLowerCase().replace(/\s+/g, '-');

  if (format === 'json') {
    return {
      content: exportTemplateToJSON(template, options),
      mimeType: 'application/json',
      fileName: `${fileName}.json`,
    };
  } else {
    return {
      content: exportTemplateToYAML(template, options),
      mimeType: 'application/x-yaml',
      fileName: `${fileName}.yaml`,
    };
  }
}

/**
 * Export multiple templates to a single file
 *
 * @param templates - Templates to export
 * @param format - Export format
 * @param options - Export options
 * @returns Export result
 *
 * @example
 * ```ts
 * const result = exportTemplates([template1, template2], 'json');
 * // Downloads file with array of templates
 * ```
 */
export function exportTemplates(
  templates: FirewallTemplate[],
  format: ExportFormat,
  options: ExportOptions = {}
): ExportResult {
  const { prettify = true, indent = 2, sanitize = true } = options;
  const fileName = options.fileName || 'firewall-templates';

  const data = sanitize ? templates.map(sanitizeTemplateForExport) : templates;

  if (format === 'json') {
    const content = prettify ? JSON.stringify(data, null, indent) : JSON.stringify(data);
    return {
      content,
      mimeType: 'application/json',
      fileName: `${fileName}.json`,
    };
  } else {
    const content = yaml.dump(data, {
      indent,
      lineWidth: 120,
      noRefs: true,
      sortKeys: false,
    });
    return {
      content,
      mimeType: 'application/x-yaml',
      fileName: `${fileName}.yaml`,
    };
  }
}

// ============================================
// DOWNLOAD HELPERS
// ============================================

/**
 * Download template as a file
 *
 * @param template - Template to download
 * @param format - File format
 * @param options - Export options
 *
 * @example
 * ```ts
 * // User clicks export button
 * downloadTemplate(template, 'json');
 * // Browser downloads "basic-security.json"
 * ```
 */
export function downloadTemplate(
  template: FirewallTemplate,
  format: ExportFormat,
  options: ExportOptions = {}
): void {
  const result = exportTemplate(template, format, options);
  downloadBlob(result.content, result.fileName, result.mimeType);
}

/**
 * Download multiple templates as a single file
 *
 * @param templates - Templates to download
 * @param format - File format
 * @param options - Export options
 */
export function downloadTemplates(
  templates: FirewallTemplate[],
  format: ExportFormat,
  options: ExportOptions = {}
): void {
  const result = exportTemplates(templates, format, options);
  downloadBlob(result.content, result.fileName, result.mimeType);
}

/**
 * Download string content as a file
 *
 * @param content - File content
 * @param fileName - File name
 * @param mimeType - MIME type
 *
 * @internal
 */
function downloadBlob(content: string, fileName: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Copy template to clipboard
 *
 * @param template - Template to copy
 * @param format - Format to use
 * @param options - Export options
 * @returns Promise that resolves when copied
 *
 * @example
 * ```ts
 * await copyTemplateToClipboard(template, 'json');
 * toast.success('Template copied to clipboard');
 * ```
 */
export async function copyTemplateToClipboard(
  template: FirewallTemplate,
  format: ExportFormat,
  options: ExportOptions = {}
): Promise<void> {
  const result = exportTemplate(template, format, options);

  try {
    await navigator.clipboard.writeText(result.content);
  } catch (error) {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = result.content;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

/**
 * Get file size in human-readable format
 *
 * @param content - Content string
 * @returns Formatted size (e.g., "1.2 KB")
 */
export function getExportSize(content: string): string {
  const bytes = new Blob([content]).size;

  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

/**
 * Generate unique template ID
 *
 * @param name - Template name
 * @param existingIds - Existing template IDs
 * @returns Unique ID
 */
export function generateTemplateId(name: string, existingIds: string[] = []): string {
  // Base ID from name
  const baseId = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // If unique, return it
  if (!existingIds.includes(baseId)) {
    return baseId;
  }

  // Add suffix until unique
  let suffix = 1;
  let candidateId = `${baseId}-${suffix}`;
  while (existingIds.includes(candidateId)) {
    suffix++;
    candidateId = `${baseId}-${suffix}`;
  }

  return candidateId;
}
