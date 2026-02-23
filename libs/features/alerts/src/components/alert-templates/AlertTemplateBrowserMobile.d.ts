/**
 * AlertTemplateBrowserMobile Component
 * NAS-18.12: Alert Rule Templates Feature
 *
 * Mobile presenter for alert rule template browser.
 * Uses bottom sheet filters and vertical list for touch-friendly interface.
 *
 * @description Provides full-width vertical list layout with bottom sheet for
 * filters (slides up from bottom). All elements have 44px minimum touch targets
 * per WCAG AAA. Sort tabs in header. Compact template cards for mobile viewing.
 *
 * @see ADR-018: Headless Platform Presenters
 */
import * as React from 'react';
import type { AlertRuleTemplate } from '../../schemas/alert-rule-template.schema';
import type { UseTemplateBrowserReturn } from './useTemplateBrowser';
export interface AlertTemplateBrowserMobileProps {
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
 * Mobile presenter for AlertTemplateBrowser
 *
 * Features:
 * - Vertical list layout optimized for mobile
 * - Bottom sheet for filters (slide up from bottom)
 * - 44px minimum touch targets (WCAG AAA)
 * - Compact template cards
 * - Sort tabs in header
 * - Apply and View Detail buttons
 * - Empty state when no templates match
 * - Touch-friendly interactions
 *
 * @description Uses full-width vertical list with bottom sheet filter panel.
 * All buttons and interactive elements are 44px minimum for touch accessibility.
 * Header includes title, filter trigger button, and sort tabs.
 *
 * @param props - Component props
 * @returns React element displaying mobile template browser UI
 */
export declare const AlertTemplateBrowserMobile: React.NamedExoticComponent<AlertTemplateBrowserMobileProps>;
//# sourceMappingURL=AlertTemplateBrowserMobile.d.ts.map