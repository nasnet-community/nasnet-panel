import type { ExportServiceConfigInput, GenerateConfigQrInput, ImportServiceConfigInput, ExportServiceConfigPayload, GenerateConfigQrPayload, ImportServiceConfigPayload } from '@nasnet/api-client/generated';
/**
 * Hook for exporting service configuration as JSON
 *
 * @example
 * ```tsx
 * const { exportService, loading, error } = useExportService();
 *
 * const result = await exportService({
 *   routerID: 'router-1',
 *   instanceID: 'instance-123',
 *   redactSecrets: true,
 *   includeRoutingRules: true,
 * });
 *
 * if (result.data?.exportServiceConfig.success) {
 *   const downloadURL = result.data.exportServiceConfig.downloadURL;
 *   window.open(downloadURL, '_blank');
 * }
 * ```
 */
export declare function useExportService(): {
    exportService: (input: ExportServiceConfigInput) => Promise<import("@apollo/client").FetchResult<{
        exportServiceConfig: ExportServiceConfigPayload;
    }>>;
    loading: boolean;
    error: import("@apollo/client").ApolloError | undefined;
    data: ExportServiceConfigPayload | undefined;
};
/**
 * Hook for generating QR code for service configuration
 *
 * @example
 * ```tsx
 * const { generateQR, loading, error } = useGenerateConfigQR();
 *
 * const result = await generateQR({
 *   routerID: 'router-1',
 *   instanceID: 'instance-123',
 *   redactSecrets: true,
 *   includeRoutingRules: false,
 *   imageSize: 512,
 * });
 *
 * if (result.data?.generateConfigQR.imageDataBase64) {
 *   const imgSrc = `data:image/png;base64,${result.data.generateConfigQR.imageDataBase64}`;
 *   // Display or download QR code
 * }
 * ```
 */
export declare function useGenerateConfigQR(): {
    generateQR: (input: GenerateConfigQrInput) => Promise<import("@apollo/client").FetchResult<{
        generateConfigQR: GenerateConfigQrPayload;
    }>>;
    loading: boolean;
    error: import("@apollo/client").ApolloError | undefined;
    data: GenerateConfigQrPayload | undefined;
};
/**
 * Hook for importing service configuration (validation + apply)
 *
 * @example
 * ```tsx
 * const { importService, loading, error } = useImportService();
 *
 * // Step 1: Validate (dry-run)
 * const validationResult = await importService({
 *   routerID: 'router-1',
 *   package: importedJSON,
 *   dryRun: true,
 * });
 *
 * if (validationResult.data?.importServiceConfig.valid) {
 *   // Step 2: Apply (if validation passed)
 *   await importService({
 *     routerID: 'router-1',
 *     package: importedJSON,
 *     dryRun: false,
 *     redactedFieldValues: { password: 'new-password' },
 *   });
 * }
 * ```
 */
export declare function useImportService(): {
    importService: (input: ImportServiceConfigInput) => Promise<import("@apollo/client").FetchResult<{
        importServiceConfig: ImportServiceConfigPayload;
    }>>;
    loading: boolean;
    error: import("@apollo/client").ApolloError | undefined;
    data: ImportServiceConfigPayload | undefined;
};
/**
 * Combined hook providing all service sharing operations
 *
 * @example
 * ```tsx
 * const { exportService, generateQR, importService, loading } = useServiceSharing();
 *
 * // Export as JSON
 * await exportService({ ... });
 *
 * // Generate QR code
 * await generateQR({ ... });
 *
 * // Import configuration
 * await importService({ ... });
 * ```
 */
export declare function useServiceSharing(): {
    exportService: (input: ExportServiceConfigInput) => Promise<import("@apollo/client").FetchResult<{
        exportServiceConfig: ExportServiceConfigPayload;
    }>>;
    generateQR: (input: GenerateConfigQrInput) => Promise<import("@apollo/client").FetchResult<{
        generateConfigQR: GenerateConfigQrPayload;
    }>>;
    importService: (input: ImportServiceConfigInput) => Promise<import("@apollo/client").FetchResult<{
        importServiceConfig: ImportServiceConfigPayload;
    }>>;
    loading: {
        export: boolean;
        qr: boolean;
        import: boolean;
    };
    errors: {
        export: import("@apollo/client").ApolloError | undefined;
        qr: import("@apollo/client").ApolloError | undefined;
        import: import("@apollo/client").ApolloError | undefined;
    };
    data: {
        export: ExportServiceConfigPayload | undefined;
        qr: GenerateConfigQrPayload | undefined;
        import: ImportServiceConfigPayload | undefined;
    };
};
//# sourceMappingURL=useServiceSharing.d.ts.map