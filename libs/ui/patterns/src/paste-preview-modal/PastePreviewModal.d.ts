/**
 * PastePreviewModal Component
 *
 * Modal for previewing and validating pasted import data.
 * Shows parsed items and validation errors before applying.
 *
 * @example
 * ```tsx
 * <PastePreviewModal
 *   open={showPreview}
 *   parseResult={result}
 *   onApply={handleApply}
 *   onCancel={() => setShowPreview(false)}
 * />
 * ```
 *
 * @see NAS-4.23 - Implement Clipboard Integration
 */
import type { ParseResult } from '../hooks/usePasteImport';
/**
 * Props for PastePreviewModal component
 */
export interface PastePreviewModalProps {
    /**
     * Whether the modal is open
     */
    open: boolean;
    /**
     * Parse result to display
     */
    parseResult: ParseResult | null;
    /**
     * Title for the modal
     * @default 'Import Preview'
     */
    title?: string;
    /**
     * Maximum height for the preview content
     * @default 400
     */
    maxPreviewHeight?: number;
    /**
     * Callback when apply is clicked
     */
    onApply: (result: ParseResult) => void;
    /**
     * Callback when cancel is clicked
     */
    onCancel: () => void;
    /**
     * Whether apply is disabled (e.g., when there are errors)
     * @default false (auto-determined by errors)
     */
    applyDisabled?: boolean;
    /**
     * Allow applying even with errors
     * @default false
     */
    allowApplyWithErrors?: boolean;
    /**
     * Custom apply button text
     * @default 'Apply'
     */
    applyText?: string;
    /**
     * Custom cancel button text
     * @default 'Cancel'
     */
    cancelText?: string;
}
/**
 * PastePreviewModal Component
 *
 * Shows a preview of parsed import data with validation errors.
 * Allows user to review before applying.
 */
export declare function PastePreviewModal({ open, parseResult, title, maxPreviewHeight, onApply, onCancel, applyDisabled, allowApplyWithErrors, applyText, cancelText, }: PastePreviewModalProps): import("react/jsx-runtime").JSX.Element | null;
export declare namespace PastePreviewModal {
    var displayName: string;
}
//# sourceMappingURL=PastePreviewModal.d.ts.map