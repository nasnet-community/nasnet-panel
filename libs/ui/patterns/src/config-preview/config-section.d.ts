/**
 * ConfigSection Component
 *
 * Collapsible section for RouterOS configuration.
 * Uses Radix Collapsible for accessible expand/collapse behavior.
 *
 * @see NAS-4A.21 - Build Config Preview Component
 */
import type { ConfigSectionComponentProps } from './config-preview.types';
/**
 * ConfigSection Component
 *
 * A collapsible section that groups related RouterOS commands.
 * Shows a header with the command path and line count when collapsed.
 *
 * @example
 * ```tsx
 * <ConfigSection
 *   section={{
 *     id: 'section-1',
 *     header: '/interface ethernet',
 *     lines: ['set ...', 'add ...'],
 *     startLine: 5,
 *     isExpanded: true,
 *   }}
 *   onToggle={() => toggleSection('section-1')}
 *   showLineNumbers
 * />
 * ```
 */
export declare function ConfigSection({ section, onToggle, showLineNumbers, startLineNumber, }: ConfigSectionComponentProps): import("react/jsx-runtime").JSX.Element;
export declare namespace ConfigSection {
    var displayName: string;
}
//# sourceMappingURL=config-section.d.ts.map