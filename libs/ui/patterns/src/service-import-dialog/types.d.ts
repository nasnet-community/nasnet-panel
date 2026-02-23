/**
 * ServiceImportDialog Types
 * Pattern component for importing service configurations
 */
import type { ImportValidationResult, ImportValidationError } from '@nasnet/api-client/generated';
/**
 * Import source type
 */
export type ImportSource = 'file' | 'paste' | 'qr';
/**
 * Import step in multi-step wizard
 */
export type ImportStep = 'select' | 'validate' | 'resolve' | 'importing' | 'complete';
/**
 * Conflict resolution strategy
 */
export type ConflictResolution = 'skip' | 'rename' | 'replace';
/**
 * Props for ServiceImportDialog component
 */
export interface ServiceImportDialogProps {
    /** Router ID to import into */
    routerID: string;
    /** Whether to open dialog by default */
    open?: boolean;
    /** Callback when dialog open state changes */
    onOpenChange?: (open: boolean) => void;
    /** Callback when import completes successfully */
    onImportComplete?: (instanceID: string) => void;
    /** Custom trigger button (optional) */
    trigger?: React.ReactNode;
}
/**
 * Import package data (from JSON or QR code)
 */
export interface ImportPackageData {
    version: string;
    exportedAt: string;
    exportedBy: string;
    sourceRouter?: {
        id: string;
        name: string;
    };
    service: {
        featureID: string;
        instanceName: string;
        config: Record<string, unknown>;
        ports?: number[];
        vlanID?: number;
        bindIP?: string;
    };
    routingRules?: Array<{
        deviceMAC: string;
        deviceName?: string;
        mode: 'direct' | 'through_service' | 'blocked';
    }>;
    redactedFields?: string[];
}
/**
 * Import state
 */
export interface ImportState {
    /** Current step in import wizard */
    step: ImportStep;
    /** Import source type */
    source: ImportSource;
    /** Raw input content (JSON string or file) */
    content: string;
    /** Parsed package data */
    packageData?: ImportPackageData;
    /** Validation result from backend */
    validationResult?: ImportValidationResult;
    /** User-provided values for redacted fields */
    redactedFieldValues: Record<string, string>;
    /** Selected conflict resolution strategy */
    conflictResolution?: ConflictResolution;
    /** Selected device MAC addresses to filter */
    deviceFilter: string[];
    /** Import progress (0-100) */
    progress: number;
    /** Error message */
    error?: string;
    /** Created instance ID (on success) */
    createdInstanceID?: string;
}
/**
 * Validation error with display metadata
 */
export interface ValidationErrorDisplay extends ImportValidationError {
    /** Whether error is expanded in UI */
    expanded?: boolean;
}
//# sourceMappingURL=types.d.ts.map