/**
 * CopyButton Component
 *
 * A button for copying values to clipboard with visual feedback.
 * Supports two variants: inline icon-only and button with text.
 *
 * @example
 * ```tsx
 * // Inline icon variant
 * <CopyButton value="192.168.1.1" variant="inline" aria-label="Copy IP address" />
 *
 * // Button with text variant
 * <CopyButton value={publicKey} variant="button" />
 *
 * // With toast notifications
 * <CopyButton
 *   value={serialNumber}
 *   showToast
 *   toastTitle="Serial number copied"
 * />
 * ```
 *
 * @see NAS-4.23 - Implement Clipboard Integration
 */
import * as React from 'react';
/**
 * CopyButton variant types
 */
export type CopyButtonVariant = 'inline' | 'button';
/**
 * Props for CopyButton component
 */
export interface CopyButtonProps {
    /**
     * The value to copy to clipboard
     */
    value: string;
    /**
     * Button variant
     * - `inline`: Small icon-only button for inline use
     * - `button`: Standard button with "Copy" text
     * @default 'inline'
     */
    variant?: CopyButtonVariant;
    /**
     * Accessible label for the copy button
     */
    'aria-label'?: string;
    /**
     * Show tooltip on hover
     * @default true
     */
    showTooltip?: boolean;
    /**
     * Tooltip text when not copied
     * @default 'Click to copy'
     */
    tooltipText?: string;
    /**
     * Tooltip text after copying
     * @default 'Copied!'
     */
    copiedTooltipText?: string;
    /**
     * Show toast notification on copy
     * @default false
     */
    showToast?: boolean;
    /**
     * Toast title on successful copy
     * @default 'Copied!'
     */
    toastTitle?: string;
    /**
     * Toast description on successful copy
     */
    toastDescription?: string;
    /**
     * Additional CSS classes
     */
    className?: string;
    /**
     * Callback fired on successful copy
     */
    onCopy?: (value: string) => void;
    /**
     * Callback fired on copy error
     */
    onError?: (error: Error) => void;
    /**
     * Whether the button is disabled
     */
    disabled?: boolean;
}
/**
 * CopyButton Component
 *
 * Provides copy-to-clipboard functionality with visual feedback.
 * Accessible via keyboard (Tab, Enter/Space) and screen readers.
 */
declare const CopyButtonComponent: React.ForwardRefExoticComponent<CopyButtonProps & React.RefAttributes<HTMLButtonElement>>;
export declare const CopyButton: typeof CopyButtonComponent;
export {};
//# sourceMappingURL=CopyButton.d.ts.map