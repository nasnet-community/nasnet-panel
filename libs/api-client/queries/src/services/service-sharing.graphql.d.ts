/**
 * GraphQL documents for Service Configuration Sharing (Export/Import)
 * Feature: NAS-8.11 - Service Sharing via JSON/QR Code
 */
/**
 * Export a service configuration as a JSON package
 * Returns a download URL with 15-minute expiry
 * Supports secret redaction and routing rule inclusion
 */
export declare const EXPORT_SERVICE_CONFIG: import('graphql').DocumentNode;
/**
 * Generate a QR code for service configuration sharing
 * Returns base64-encoded PNG image (256x256 by default)
 * Enforces 2KB size limit for QR code data
 */
export declare const GENERATE_CONFIG_QR: import('graphql').DocumentNode;
/**
 * Import a service configuration package (validation only)
 * Performs 7-stage validation pipeline without making changes
 * Returns validation results and conflicts
 */
export declare const IMPORT_SERVICE_CONFIG: import('graphql').DocumentNode;
//# sourceMappingURL=service-sharing.graphql.d.ts.map
