/**
 * CodeBlockCopy Component
 *
 * Displays code/config blocks with copy functionality.
 * Preserves formatting and comments when copying.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <CodeBlockCopy code={firewallRule} />
 *
 * // With line numbers
 * <CodeBlockCopy code={script} showLineNumbers />
 *
 * // RouterOS config
 * <CodeBlockCopy code={config} language="routeros" title="Firewall Rule" />
 * ```
 *
 * @see NAS-4.23 - Implement Clipboard Integration
 */
import * as React from 'react';
/**
 * Supported syntax languages for styling hints
 */
export type CodeBlockLanguage = 'routeros' | 'json' | 'yaml' | 'shell' | 'text';
/**
 * Props for CodeBlockCopy component
 * Displays code/configuration blocks with copy-to-clipboard functionality
 */
export interface CodeBlockCopyProps {
    /**
     * The code/configuration to display
     * Preserves all whitespace and formatting
     */
    code: string;
    /**
     * Language for syntax hints (does not enable full highlighting)
     * Used for display badge and styling hints
     * @default 'text'
     */
    language?: CodeBlockLanguage;
    /**
     * Title to display above the code block
     * Optional header text to identify the code content
     */
    title?: string;
    /**
     * Show line numbers alongside code
     * Useful for long scripts or configuration blocks
     * @default false
     */
    showLineNumbers?: boolean;
    /**
     * Maximum height with vertical scroll
     * Can be a pixel value (number) or CSS length (string like '300px', '50vh')
     */
    maxHeight?: number | string;
    /**
     * Show toast notification on successful copy
     * @default true
     */
    showToast?: boolean;
    /**
     * Custom toast title shown on copy success
     * @default 'Copied!'
     */
    toastTitle?: string;
    /**
     * Custom toast description shown on copy success
     */
    toastDescription?: string;
    /**
     * Additional CSS classes for the outer container
     * Use for layout/spacing customization
     */
    className?: string;
    /**
     * Additional CSS classes for the code element
     * Use for font, color, or text styling
     */
    codeClassName?: string;
    /**
     * Callback fired on successful copy
     * Called after code is copied to clipboard
     * @param code The code that was copied
     */
    onCopy?: (code: string) => void;
}
/**
 * CodeBlockCopy Component
 *
 * Displays code/config blocks with a copy button in the top-right corner.
 * Preserves all formatting including whitespace and comments.
 */
declare function CodeBlockCopyComponent({ code, language, title, showLineNumbers, maxHeight, showToast: showToastProp, toastTitle, toastDescription, className, codeClassName, onCopy, }: CodeBlockCopyProps): import("react/jsx-runtime").JSX.Element;
declare namespace CodeBlockCopyComponent {
    var displayName: string;
}
export declare const CodeBlockCopy: React.MemoExoticComponent<typeof CodeBlockCopyComponent>;
export {};
//# sourceMappingURL=CodeBlockCopy.d.ts.map