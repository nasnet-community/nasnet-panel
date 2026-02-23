/**
 * useServiceImportDialog - Headless hook for service import dialog
 * Contains all business logic for importing service configurations
 * Multi-step wizard: select → validate → resolve → importing → complete
 */
import type { ServiceImportDialogProps, ImportState, ImportSource, ConflictResolution } from './types';
export declare function useServiceImportDialog(props: ServiceImportDialogProps): {
    state: ImportState;
    loading: boolean;
    setSource: (source: ImportSource) => void;
    setContent: (content: string) => void;
    handleFileUpload: (file: File) => void;
    handleValidate: () => Promise<void>;
    setRedactedFieldValue: (field: string, value: string) => void;
    setConflictResolution: (resolution: ConflictResolution) => void;
    toggleDeviceFilter: (deviceMAC: string) => void;
    handleImport: () => Promise<void>;
    reset: () => void;
};
//# sourceMappingURL=useServiceImportDialog.d.ts.map