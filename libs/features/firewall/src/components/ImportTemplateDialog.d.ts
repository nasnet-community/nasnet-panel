/**
 * ImportTemplateDialog Component
 *
 * @description Multi-step dialog for importing firewall templates from JSON/YAML files
 * with drag-and-drop support, automatic validation, conflict detection, and preview
 * before final import. Supports both controlled and uncontrolled modes.
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 * <ImportTemplateDialog
 *   existingNames={['SSH Rules', 'Web Services']}
 *   onImport={async (template) => {
 *     await importTemplateAPI(template);
 *   }}
 *   open={open}
 *   onOpenChange={setOpen}
 * />
 * ```
 */
import React from 'react';
import type { FirewallTemplate } from '../schemas/templateSchemas';
export interface ImportTemplateDialogProps {
    /** Existing template names for conflict detection */
    existingNames?: string[];
    /** Callback when template is successfully imported */
    onImport: (template: FirewallTemplate) => Promise<void>;
    /** Optional trigger element to open dialog */
    trigger?: React.ReactNode;
    /** Controlled: whether dialog is open */
    open?: boolean;
    /** Controlled: callback when open state changes */
    onOpenChange?: (open: boolean) => void;
}
/**
 * Multi-step import dialog with file upload, validation, and preview
 */
export declare const ImportTemplateDialog: React.NamedExoticComponent<ImportTemplateDialogProps>;
//# sourceMappingURL=ImportTemplateDialog.d.ts.map