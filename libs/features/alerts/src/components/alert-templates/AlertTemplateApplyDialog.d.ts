/**
 * AlertTemplateApplyDialog Component
 * NAS-18.12: Alert Rule Templates Feature
 *
 * Full-featured dialog for applying an alert rule template.
 * Includes dynamic variable input form, real-time validation, and condition preview.
 *
 * Features:
 * - Fetches template data using useAlertRuleTemplate hook
 * - Dynamic form generation based on template variables
 * - React Hook Form + Zod validation
 * - Real-time preview of resolved conditions
 * - Responsive (Dialog for desktop, Sheet for mobile)
 * - Optimistic mutations with error handling
 */
import * as React from 'react';
/**
 * Props for AlertTemplateApplyDialog component
 */
export interface AlertTemplateApplyDialogProps {
    /** @description Template ID to apply */
    templateId: string | null;
    /** @description Open state (controlled) */
    open: boolean;
    /** @description Callback when dialog is closed */
    onClose: () => void;
    /** @description Callback when template is successfully applied */
    onSuccess?: (alertRuleId: string) => void;
    /** @description Callback when application fails */
    onError?: (error: string) => void;
}
/**
 * AlertTemplateApplyDialog - Apply template with form and preview
 *
 * @description Complete workflow for applying an alert rule template including
 * dynamic form generation, real-time preview, and optimistic mutations.
 *
 * @param props - Component props
 * @returns React component
 */
export declare const AlertTemplateApplyDialog: React.NamedExoticComponent<AlertTemplateApplyDialogProps>;
//# sourceMappingURL=AlertTemplateApplyDialog.d.ts.map