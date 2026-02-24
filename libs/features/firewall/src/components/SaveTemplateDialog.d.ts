/**
 * SaveTemplateDialog - Create custom firewall templates
 *
 * Features:
 * - Name, description, category form
 * - Variable parameterization with checkboxes
 * - Auto-generate template from current rules
 * - Version control
 *
 * @module @nasnet/features/firewall/components
 */
import React from 'react';
import { type FirewallTemplate, type TemplateRule } from '../schemas/templateSchemas';
export interface SaveTemplateDialogProps {
    /** Current firewall rules to use as template source */
    rules: TemplateRule[];
    /** Existing template names (for uniqueness validation) */
    existingNames?: string[];
    /** Callback when template is saved */
    onSave: (template: FirewallTemplate) => Promise<void>;
    /** Trigger element */
    trigger?: React.ReactNode;
    /** Whether dialog is open (controlled mode) */
    open?: boolean;
    /** Callback when open state changes (controlled mode) */
    onOpenChange?: (open: boolean) => void;
    /** Optional CSS class for styling */
    className?: string;
}
/**
 * SaveTemplateDialog Component
 *
 * @description Provides a dialog for saving firewall rules as reusable templates
 * with variable parameterization and version control.
 *
 * @example
 * ```tsx
 * <SaveTemplateDialog
 *   rules={selectedRules}
 *   onSave={handleSaveTemplate}
 *   existingNames={templateNames}
 * />
 * ```
 */
export declare const SaveTemplateDialog: React.NamedExoticComponent<SaveTemplateDialogProps>;
//# sourceMappingURL=SaveTemplateDialog.d.ts.map