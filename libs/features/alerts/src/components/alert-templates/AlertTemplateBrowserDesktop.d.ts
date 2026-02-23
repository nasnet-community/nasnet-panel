/**
 * AlertTemplateBrowserDesktop Component
 * NAS-18.12: Alert Rule Templates Feature
 *
 * Desktop presenter for alert rule template browser.
 * Uses sidebar with filters and grid layout for optimal desktop viewing.
 *
 * @description Provides fixed sidebar navigation with category/severity filters,
 * dense grid layout (1-3 columns), and sort controls in header. Implements full
 * keyboard navigation and WCAG AAA compliance.
 *
 * @see ADR-018: Headless Platform Presenters
 */
import * as React from 'react';
import type { AlertRuleTemplate } from '../../schemas/alert-rule-template.schema';
import type { UseTemplateBrowserReturn } from './useTemplateBrowser';
export interface AlertTemplateBrowserDesktopProps {
    /** Template browser hook return value */
    browser: UseTemplateBrowserReturn;
    /** Callback when template is previewed */
    onPreview?: (template: AlertRuleTemplate) => void;
    /** Callback when template detail is viewed */
    onViewDetail?: (template: AlertRuleTemplate) => void;
    /** Loading state */
    loading?: boolean;
    /** Container className */
    className?: string;
}
/**
 * Desktop presenter for AlertTemplateBrowser
 *
 * Features:
 * - Sidebar with filters (category, severity, type, search)
 * - Grid layout for templates (responsive: 1-3 columns)
 * - Sort controls in header
 * - Apply and View Detail buttons on each card
 * - Empty state when no templates match
 * - WCAG AAA compliant (keyboard nav, ARIA labels, 7:1 contrast)
 *
 * @description Uses fixed sidebar (240px) for filters, main content area with
 * grid of template cards (1-3 columns depending on viewport). All interactive
 * elements have 44px minimum touch targets and visible focus indicators.
 *
 * @param props - Component props
 * @returns React element displaying template browser UI
 */
export declare const AlertTemplateBrowserDesktop: React.NamedExoticComponent<AlertTemplateBrowserDesktopProps>;
//# sourceMappingURL=AlertTemplateBrowserDesktop.d.ts.map