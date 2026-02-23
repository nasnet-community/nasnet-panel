/**
 * ImportTemplateDialog Component
 * NAS-18.12: Alert Rule Templates Feature
 *
 * @description Dialog for importing alert rule templates from JSON files.
 * Supports file upload or JSON paste with validation.
 */
import * as React from 'react';
/**
 * Props for ImportTemplateDialog component
 */
export interface ImportTemplateDialogProps {
    /** @description Whether the dialog is open */
    open: boolean;
    /** @description Callback when dialog is closed */
    onOpenChange: (isOpen: boolean) => void;
    /** @description Callback when template is successfully imported */
    onTemplateImported?: (templateId: string) => void;
}
/**
 * ImportTemplateDialog - Import alert rule template from JSON
 *
 * @description Dialog for importing alert rule templates with file upload
 * or JSON paste, including client and server-side validation.
 *
 * @param props - Component props
 * @returns React component
 */
export declare const ImportTemplateDialog: React.NamedExoticComponent<ImportTemplateDialogProps>;
//# sourceMappingURL=ImportTemplateDialog.d.ts.map