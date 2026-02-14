import { useMutation, useApolloClient } from '@apollo/client';
import {
  EXPORT_SERVICE_CONFIG,
  GENERATE_CONFIG_QR,
  IMPORT_SERVICE_CONFIG,
} from './service-sharing.graphql';
import { GET_SERVICE_INSTANCES, GET_SERVICE_INSTANCE } from './services.graphql';
import type {
  ExportServiceConfigInput,
  GenerateConfigQrInput,
  ImportServiceConfigInput,
  ExportServiceConfigPayload,
  GenerateConfigQrPayload,
  ImportServiceConfigPayload,
} from '@nasnet/api-client/generated';

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
export function useExportService() {
  const [exportServiceMutation, { loading, error, data }] = useMutation<
    { exportServiceConfig: ExportServiceConfigPayload },
    { input: ExportServiceConfigInput }
  >(EXPORT_SERVICE_CONFIG);

  const exportService = async (input: ExportServiceConfigInput) => {
    return exportServiceMutation({ variables: { input } });
  };

  return {
    exportService,
    loading,
    error,
    data: data?.exportServiceConfig,
  };
}

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
export function useGenerateConfigQR() {
  const [generateQRMutation, { loading, error, data }] = useMutation<
    { generateConfigQR: GenerateConfigQrPayload },
    { input: GenerateConfigQrInput }
  >(GENERATE_CONFIG_QR);

  const generateQR = async (input: GenerateConfigQrInput) => {
    return generateQRMutation({ variables: { input } });
  };

  return {
    generateQR,
    loading,
    error,
    data: data?.generateConfigQR,
  };
}

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
export function useImportService() {
  const client = useApolloClient();

  const [importServiceMutation, { loading, error, data }] = useMutation<
    { importServiceConfig: ImportServiceConfigPayload },
    { input: ImportServiceConfigInput }
  >(IMPORT_SERVICE_CONFIG, {
    onCompleted: (result) => {
      // If import succeeded (dry-run=false), refetch service instances
      if (result?.importServiceConfig.valid) {
        client.refetchQueries({
          include: [GET_SERVICE_INSTANCES, GET_SERVICE_INSTANCE],
        });
      }
    },
  });

  const importService = async (input: ImportServiceConfigInput) => {
    return importServiceMutation({ variables: { input } });
  };

  return {
    importService,
    loading,
    error,
    data: data?.importServiceConfig,
  };
}

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
export function useServiceSharing() {
  const exportHook = useExportService();
  const qrHook = useGenerateConfigQR();
  const importHook = useImportService();

  return {
    exportService: exportHook.exportService,
    generateQR: qrHook.generateQR,
    importService: importHook.importService,
    loading: {
      export: exportHook.loading,
      qr: qrHook.loading,
      import: importHook.loading,
    },
    errors: {
      export: exportHook.error,
      qr: qrHook.error,
      import: importHook.error,
    },
    data: {
      export: exportHook.data,
      qr: qrHook.data,
      import: importHook.data,
    },
  };
}
