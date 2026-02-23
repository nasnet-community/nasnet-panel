/**
 * useConfigPreview Hook
 *
 * Headless hook providing all business logic for ConfigPreview component.
 * Handles script parsing, section management, diff computation,
 * clipboard copy, and file download.
 *
 * @see NAS-4A.21 - Build Config Preview Component
 * @see ADR-018 - Headless + Platform Presenters
 */
import type { UseConfigPreviewConfig, UseConfigPreviewReturn } from './config-preview.types';
/**
 * Hook providing all business logic for ConfigPreview component
 *
 * Features:
 * - Script parsing into collapsible sections
 * - Diff computation between old and new scripts
 * - Section expand/collapse management
 * - Clipboard copy with toast feedback
 * - File download as .rsc
 *
 * @param config - Configuration options
 * @returns State and actions for ConfigPreview
 *
 * @example
 * ```tsx
 * const state = useConfigPreview({
 *   script: routerOsConfig,
 *   previousScript: oldConfig,
 *   showDiff: true,
 *   routerName: 'router-1',
 *   onCopy: () => console.log('Copied!'),
 * });
 *
 * return (
 *   <div>
 *     {state.sections.map(section => (
 *       <Section
 *         key={section.id}
 *         section={section}
 *         onToggle={() => state.toggleSection(section.id)}
 *       />
 *     ))}
 *   </div>
 * );
 * ```
 */
export declare function useConfigPreview({ script, previousScript, showDiff, collapsible, routerName, onCopy, onDownload, }: UseConfigPreviewConfig): UseConfigPreviewReturn;
//# sourceMappingURL=use-config-preview.d.ts.map