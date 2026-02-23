/**
 * SyntaxHighlight Component
 *
 * Renders RouterOS code with syntax highlighting using highlight.js.
 * Supports line numbers and semantic color tokens.
 *
 * @see NAS-4A.21 - Build Config Preview Component
 */
import type { SyntaxHighlightProps } from './config-preview.types';
/**
 * SyntaxHighlight Component
 *
 * Renders code with syntax highlighting and optional line numbers.
 * Uses highlight.js for RouterOS syntax highlighting with semantic
 * color tokens for proper theming.
 *
 * @example
 * ```tsx
 * <SyntaxHighlight
 *   code={routerOsScript}
 *   showLineNumbers
 *   startLineNumber={1}
 * />
 * ```
 */
export declare function SyntaxHighlight({ code, showLineNumbers, startLineNumber, className, }: SyntaxHighlightProps): import("react/jsx-runtime").JSX.Element;
export declare namespace SyntaxHighlight {
    var displayName: string;
}
//# sourceMappingURL=syntax-highlight.d.ts.map