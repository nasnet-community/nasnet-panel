/**
 * DiffView Component
 *
 * Renders a unified diff view showing added, removed, and unchanged lines.
 * Uses semantic color tokens for proper theming.
 *
 * @see NAS-4A.21 - Build Config Preview Component
 */
import type { DiffViewProps } from './config-preview.types';
/**
 * DiffView Component
 *
 * Displays a unified diff view with color-coded additions and deletions.
 * Shows line numbers for both old and new versions.
 *
 * @example
 * ```tsx
 * const { diffLines } = useDiff({ oldScript, newScript });
 *
 * <DiffView
 *   lines={diffLines}
 *   showLineNumbers
 * />
 * ```
 */
export declare function DiffView({ lines, showLineNumbers, className, }: DiffViewProps): import("react/jsx-runtime").JSX.Element;
export declare namespace DiffView {
    var displayName: string;
}
//# sourceMappingURL=diff-view.d.ts.map