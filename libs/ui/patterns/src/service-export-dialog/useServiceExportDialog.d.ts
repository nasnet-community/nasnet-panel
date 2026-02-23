/**
 * useServiceExportDialog - Headless hook for service export dialog
 * Contains all business logic for exporting service configurations
 */
import type { ServiceExportDialogProps, ExportOptions, ExportState, ExportFormat } from './types';
export declare function useServiceExportDialog(props: ServiceExportDialogProps): {
    state: ExportState;
    loading: boolean;
    instance: import("@nasnet/api-client/queries").ServiceInstance;
    setFormat: (format: ExportFormat) => void;
    setOptions: (updates: Partial<ExportOptions>) => void;
    handleExport: () => Promise<void>;
    handleDownload: () => void;
    handleCopy: () => Promise<void>;
    reset: () => void;
};
//# sourceMappingURL=useServiceExportDialog.d.ts.map