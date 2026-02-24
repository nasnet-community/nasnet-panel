/**
 * AddressListImportDialog - Bulk import address list entries
 * Supports CSV, JSON, and TXT formats with drag-and-drop and paste
 */
import { type ParsedAddress } from '../utils/addressListParsers';
export interface AddressListImportDialogProps {
    /** Router ID for the import */
    routerId: string;
    /** Callback when import is completed */
    onImport?: (listName: string, entries: ParsedAddress[]) => Promise<void>;
    /** Available list names for autocomplete */
    existingLists?: string[];
    /** Optional CSS class */
    className?: string;
}
export declare function AddressListImportDialog({ routerId, onImport, existingLists, className, }: AddressListImportDialogProps): import("react/jsx-runtime").JSX.Element;
export declare namespace AddressListImportDialog {
    var displayName: string;
}
//# sourceMappingURL=AddressListImportDialog.d.ts.map