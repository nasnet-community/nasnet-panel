/**
 * TemplatePreviewDesktop Component
 *
 * Desktop presenter for template preview.
 * Two-column layout: variables editor on left, preview on right.
 */
import * as React from 'react';
import type { UseTemplatePreviewReturn } from './use-template-preview';
export interface TemplatePreviewDesktopProps {
    /** Template preview hook return value */
    preview: UseTemplatePreviewReturn;
    /** Callback when Apply button is clicked */
    onApply?: () => void;
    /** Callback when Cancel button is clicked */
    onCancel?: () => void;
    /** Whether apply action is loading */
    isApplying?: boolean;
    /** Container className */
    className?: string;
}
/**
 * Desktop presenter for TemplatePreview
 *
 * Features:
 * - Two-column layout (variables left, preview right)
 * - Tabbed preview (rules, conflicts, impact)
 * - Generate preview button
 * - Apply/Cancel actions
 * - Loading and error states
 */
declare function TemplatePreviewDesktopComponent({ preview, onApply, onCancel, isApplying, className, }: TemplatePreviewDesktopProps): import("react/jsx-runtime").JSX.Element;
export declare const TemplatePreviewDesktop: React.MemoExoticComponent<typeof TemplatePreviewDesktopComponent>;
export {};
//# sourceMappingURL=TemplatePreviewDesktop.d.ts.map