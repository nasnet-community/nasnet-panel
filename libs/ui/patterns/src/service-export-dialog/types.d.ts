/**
 * ServiceExportDialog Types
 * Pattern component for exporting service configurations
 */
import type { ServiceInstance } from '@nasnet/api-client/queries';
/**
 * Export format options
 */
export type ExportFormat = 'json' | 'qr';
/**
 * Props for ServiceExportDialog component
 */
export interface ServiceExportDialogProps {
    /** Router ID */
    routerID: string;
    /** Service instance to export */
    instance: ServiceInstance;
    /** Whether to open dialog by default */
    open?: boolean;
    /** Callback when dialog open state changes */
    onOpenChange?: (open: boolean) => void;
    /** Callback when export completes successfully */
    onExportComplete?: (format: ExportFormat, downloadURL?: string) => void;
    /** Custom trigger button (optional) */
    trigger?: React.ReactNode;
}
/**
 * Export options state
 */
export interface ExportOptions {
    /** Selected export format */
    format: ExportFormat;
    /** Whether to redact sensitive fields */
    redactSecrets: boolean;
    /** Whether to include device routing rules */
    includeRoutingRules: boolean;
    /** QR code image size (only for QR format) */
    qrImageSize: number;
}
/**
 * Export state
 */
export interface ExportState {
    /** Current step in export flow */
    step: 'configure' | 'exporting' | 'complete';
    /** Export options */
    options: ExportOptions;
    /** Download URL (JSON format) */
    downloadURL?: string;
    /** Base64-encoded QR code image (QR format) */
    qrImageData?: string;
    /** Export error message */
    error?: string;
    /** Whether copy to clipboard succeeded */
    copySuccess: boolean;
}
//# sourceMappingURL=types.d.ts.map