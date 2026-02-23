/**
 * TemplatePreviewMobile Component
 *
 * Mobile presenter for template preview.
 * Accordion sections for variables, rules, conflicts, and impact.
 */
import * as React from 'react';
import type { UseTemplatePreviewReturn } from './use-template-preview';
export interface TemplatePreviewMobileProps {
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
 * Mobile presenter for TemplatePreview
 *
 * Features:
 * - Accordion sections (variables, rules, conflicts, impact)
 * - 44px minimum touch targets
 * - Vertical scrolling layout
 * - Generate preview button
 * - Apply/Cancel actions
 * - Loading and error states
 */
declare function TemplatePreviewMobileComponent({ preview, onApply, onCancel, isApplying, className, }: TemplatePreviewMobileProps): import("react/jsx-runtime").JSX.Element;
export declare const TemplatePreviewMobile: React.MemoExoticComponent<typeof TemplatePreviewMobileComponent>;
export {};
//# sourceMappingURL=TemplatePreviewMobile.d.ts.map