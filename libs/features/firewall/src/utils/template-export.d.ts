/**
 * Template Export Utility
 *
 * @description
 * Export firewall templates to JSON or YAML format with download helpers.
 * Handles sanitization, formatting, and browser download.
 *
 * @module @nasnet/features/firewall/utils
 */
import type { FirewallTemplate } from '../schemas/templateSchemas';
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
export declare function exportTemplateToJSON(template: FirewallTemplate, options?: ExportOptions): string;
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
export declare function exportTemplateToYAML(template: FirewallTemplate, options?: ExportOptions): string;
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
export declare function exportTemplate(template: FirewallTemplate, format: ExportFormat, options?: ExportOptions): ExportResult;
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
export declare function exportTemplates(templates: FirewallTemplate[], format: ExportFormat, options?: ExportOptions): ExportResult;
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
export declare function downloadTemplate(template: FirewallTemplate, format: ExportFormat, options?: ExportOptions): void;
/**
 * Download multiple templates as a single file
 *
 * @param templates - Templates to download
 * @param format - File format
 * @param options - Export options
 */
export declare function downloadTemplates(templates: FirewallTemplate[], format: ExportFormat, options?: ExportOptions): void;
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
export declare function copyTemplateToClipboard(template: FirewallTemplate, format: ExportFormat, options?: ExportOptions): Promise<void>;
/**
 * Get file size in human-readable format
 *
 * @param content - Content string
 * @returns Formatted size (e.g., "1.2 KB")
 */
export declare function getExportSize(content: string): string;
/**
 * Generate unique template ID
 *
 * @param name - Template name
 * @param existingIds - Existing template IDs
 * @returns Unique ID
 */
export declare function generateTemplateId(name: string, existingIds?: string[]): string;
//# sourceMappingURL=template-export.d.ts.map