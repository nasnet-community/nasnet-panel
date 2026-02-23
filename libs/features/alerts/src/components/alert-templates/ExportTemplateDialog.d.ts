/**
 * ExportTemplateDialog Component
 * NAS-18.12: Alert Rule Templates Feature
 *
 * Dialog for exporting alert rule templates as JSON files.
 * Provides JSON preview and download functionality.
 *
 * @description Manages the export workflow: fetch template from server,
 * display formatted JSON in a textarea, and provide copy/download options.
 * All actions are reversible (close dialog discards content).
 */
import React from 'react';
export interface ExportTemplateDialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** Callback when dialog is closed */
    onOpenChange: (open: boolean) => void;
    /** Template ID to export */
    templateId: string | null;
    /** Template name for filename */
    templateName?: string;
    /** Optional CSS class name */
    className?: string;
}
/**
 * ExportTemplateDialog - Export alert rule template as JSON
 *
 * Features:
 * - Fetches template JSON from server
 * - Pretty-printed JSON preview
 * - Copy to clipboard
 * - Download as .json file
 * - Filename based on template name
 *
 * Workflow:
 * 1. User opens dialog for selected template
 * 2. Server exports template as JSON string
 * 3. JSON is displayed in textarea (read-only)
 * 4. User can copy to clipboard OR download file
 * 5. Downloaded file is named: template-name.json
 *
 * Use Cases:
 * - Backup custom templates
 * - Share templates with other users
 * - Version control templates in git
 * - Migrate templates between systems
 *
 * @example
 * ```tsx
 * <ExportTemplateDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   templateId={selectedTemplate?.id}
 *   templateName={selectedTemplate?.name}
 * />
 * ```
 */
declare function ExportTemplateDialogComponent(props: ExportTemplateDialogProps): import("react/jsx-runtime").JSX.Element;
declare namespace ExportTemplateDialogComponent {
    var displayName: string;
}
/**
 * Memoized export dialog for preventing unnecessary re-renders.
 * @description Compares props shallowly to determine if re-render is needed.
 * Beneficial when parent component re-renders frequently.
 */
export declare const ExportTemplateDialog: React.MemoExoticComponent<typeof ExportTemplateDialogComponent>;
export {};
//# sourceMappingURL=ExportTemplateDialog.d.ts.map