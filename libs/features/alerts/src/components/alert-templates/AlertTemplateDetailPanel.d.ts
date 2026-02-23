/**
 * AlertTemplateDetailPanel Component
 * NAS-18.12: Alert Rule Templates Feature
 *
 * @description Displays detailed information about an alert rule template.
 * Shows conditions, variables, channels, throttling, and metadata with
 * interactive variable input form for customization.
 *
 * @see ADR-018: Headless Platform Presenters
 */
import * as React from 'react';
import type { AlertRuleTemplate } from '../../schemas/alert-rule-template.schema';
import { type VariableValues } from './AlertTemplateVariableInputForm';
/**
 * Props for AlertTemplateDetailPanel component
 */
export interface AlertTemplateDetailPanelProps {
    /** @description Template to display (null to close panel) */
    template: AlertRuleTemplate | null;
    /** @description Callback when panel is closed */
    onClose: () => void;
    /** @description Callback when Apply button is clicked with variable values */
    onApply?: (template: AlertRuleTemplate, variables: VariableValues) => void;
    /** @description Callback when Export button is clicked */
    onExport?: (template: AlertRuleTemplate) => void;
    /** @description Callback when Delete button is clicked (custom templates only) */
    onDelete?: (template: AlertRuleTemplate) => void;
    /** @description Open state (controlled) */
    open?: boolean;
    /** @description Whether form is submitting */
    isSubmitting?: boolean;
}
/**
 * AlertTemplateDetailPanel - Display template details with interactive configuration
 *
 * @description Responsive detail view for alert templates with multi-tab layout
 * showing conditions, variables, channels, and actions.
 *
 * @param props - Component props
 * @returns React component
 */
export declare const AlertTemplateDetailPanel: React.NamedExoticComponent<AlertTemplateDetailPanelProps>;
//# sourceMappingURL=AlertTemplateDetailPanel.d.ts.map