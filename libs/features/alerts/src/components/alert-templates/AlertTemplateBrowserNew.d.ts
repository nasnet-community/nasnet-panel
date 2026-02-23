/**
 * AlertTemplateBrowserNew Component
 * NAS-18.12: Alert Rule Templates Feature
 *
 * @description Platform router that delegates to Desktop or Mobile presenters.
 * Automatically detects viewport size and renders appropriate UI.
 *
 * @example
 * ```tsx
 * <AlertTemplateBrowserNew
 *   onApply={(template) => openApplyDialog(template)}
 *   onViewDetail={(template) => openDetailPanel(template)}
 *   initialCategory="NETWORK"
 * />
 * ```
 *
 * @see ADR-018: Headless Platform Presenters
 */
import * as React from 'react';
import type { AlertRuleTemplate } from '../../schemas/alert-rule-template.schema';
/**
 * Props for AlertTemplateBrowserNew component
 */
export interface AlertTemplateBrowserNewProps {
    /** @description Callback when template is applied (opens preview/variable input dialog) */
    onApply?: (template: AlertRuleTemplate) => void;
    /** @description Callback when template detail is viewed */
    onViewDetail?: (template: AlertRuleTemplate) => void;
    /** @description Optional initial category filter */
    initialCategory?: string;
    /** @description Container className for responsive styling */
    className?: string;
}
/**
 * AlertTemplateBrowserNew - Browse and apply alert rule templates
 *
 * @description Provides platform-aware template browsing with filtering, search, and sorting.
 * Features automatic platform detection and responsive layout (Mobile/Desktop).
 *
 * @param props - Component props
 * @returns React component
 */
export declare const AlertTemplateBrowserNew: React.NamedExoticComponent<AlertTemplateBrowserNewProps>;
//# sourceMappingURL=AlertTemplateBrowserNew.d.ts.map