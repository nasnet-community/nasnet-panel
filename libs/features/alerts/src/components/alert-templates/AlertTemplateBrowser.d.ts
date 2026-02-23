/**
 * AlertTemplateBrowser Component
 * NAS-18.12: Alert Rule Templates Feature
 *
 * Layer 3 domain component that composes the Layer 2 TemplateGallery pattern
 * with alert-specific configuration and data.
 *
 * Provides a browseable gallery of alert rule templates with filtering by category,
 * search, and template application functionality.
 *
 * @description Manages GraphQL queries for alert templates and mutation for applying them.
 * Transforms API responses to TemplateGallery format. Auto-responsive via TemplateGallery.
 */
import React from 'react';
/**
 * Props for AlertTemplateBrowser component
 */
export interface AlertTemplateBrowserProps {
    /** Callback when a rule is successfully created from template (receives rule ID) */
    onRuleCreated?: (ruleId: string) => void;
    /** Optional initial category filter (e.g., 'network', 'security') */
    initialCategory?: string;
    /** Optional CSS class name for container */
    className?: string;
}
/**
 * AlertTemplateBrowser - Browse and apply alert rule templates
 *
 * Features:
 * - Filter by 7 categories (Network, Security, Resources, VPN, DHCP, System, Custom)
 * - Search by template name or description
 * - Sort by name, category, or date
 * - Preview template with variable substitution
 * - Create alert rule from template with custom values
 * - Built-in and custom templates
 *
 * Architecture:
 * - Composes Layer 2 TemplateGallery pattern component
 * - Provides alert-specific data and configuration
 * - Handles alert rule creation via GraphQL mutation
 * - Automatically responsive (Mobile/Desktop) via TemplateGallery
 *
 * @description Uses useAlertRuleTemplates query to fetch templates from backend.
 * Transforms AlertRuleTemplate to generic template format. Handles mutation errors
 * with toast notifications. Memoizes template transformations with useMemo.
 *
 * @param props Component props
 * @returns React element (responsive via TemplateGallery)
 */
export declare const AlertTemplateBrowser: React.NamedExoticComponent<AlertTemplateBrowserProps>;
//# sourceMappingURL=AlertTemplateBrowser.d.ts.map