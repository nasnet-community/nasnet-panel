/**
 * AddressListExportDialog Component
 * @description Export address list entries in CSV, JSON, or RouterOS script (.rsc) formats
 * Allows users to choose format, preview content, and download or copy to clipboard
 */
import { type AddressListEntry } from '../utils/addressListFormatters';
export interface AddressListExportDialogProps {
    /** List name to export (used in filename and list parameter) */
    listName: string;
    /** Entries to export */
    entries: AddressListEntry[];
    /** Optional trigger button text (default: "Export") */
    triggerText?: string;
    /** Optional CSS class names to apply */
    className?: string;
}
/**
 * AddressListExportDialog Component
 * @description Modal dialog for exporting address list entries in multiple formats
 * Features:
 * - Format selection (CSV, JSON, RouterOS script)
 * - Content preview with truncation for large files
 * - Download and copy-to-clipboard actions
 * - File size estimation
 *
 * @example
 * ```tsx
 * <AddressListExportDialog
 *   listName="blocklist"
 *   entries={entries}
 *   triggerText="Export"
 * />
 * ```
 *
 * @param props - Component props
 * @returns Export dialog with trigger button
 */
export declare const AddressListExportDialog: import("react").NamedExoticComponent<AddressListExportDialogProps>;
//# sourceMappingURL=AddressListExportDialog.d.ts.map