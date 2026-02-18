/**
 * useServiceExportDialog - Headless hook for service export dialog
 * Contains all business logic for exporting service configurations
 */

import { useState, useCallback } from 'react';

import {
  useExportService,
  useGenerateConfigQR,
} from '@nasnet/api-client/queries';

import type { ServiceExportDialogProps, ExportOptions, ExportState, ExportFormat } from './types';

export function useServiceExportDialog(props: ServiceExportDialogProps) {
  const { routerID, instance, onExportComplete } = props;

  // Apollo hooks
  const { exportService, loading: exportLoading } = useExportService();
  const { generateQR, loading: qrLoading } = useGenerateConfigQR();

  // Local state
  const [state, setState] = useState<ExportState>({
    step: 'configure',
    options: {
      format: 'json',
      redactSecrets: true,
      includeRoutingRules: false,
      qrImageSize: 256,
    },
    copySuccess: false,
  });

  // Update export options
  const setOptions = useCallback((updates: Partial<ExportOptions>) => {
    setState((prev) => ({
      ...prev,
      options: { ...prev.options, ...updates },
    }));
  }, []);

  // Set export format
  const setFormat = useCallback((format: ExportFormat) => {
    setOptions({ format });
  }, [setOptions]);

  // Reset state
  const reset = useCallback(() => {
    setState({
      step: 'configure',
      options: {
        format: 'json',
        redactSecrets: true,
        includeRoutingRules: false,
        qrImageSize: 256,
      },
      copySuccess: false,
    });
  }, []);

  // Execute export
  const handleExport = useCallback(async () => {
    const { format, redactSecrets, includeRoutingRules, qrImageSize } = state.options;

    setState((prev) => ({ ...prev, step: 'exporting', error: undefined }));

    try {
      if (format === 'json') {
        // Export as JSON
        const result = await exportService({
          routerID,
          instanceID: instance.id,
          redactSecrets,
          includeRoutingRules,
        });

        const exportPayload = result.data?.exportServiceConfig;
        if (exportPayload?.success && exportPayload.downloadURL) {
          setState((prev) => ({
            ...prev,
            step: 'complete',
            downloadURL: exportPayload.downloadURL!,
          }));
          onExportComplete?.('json', exportPayload.downloadURL!);
        } else {
          const errorMsg = exportPayload?.errors?.[0]?.message || 'Export failed';
          setState((prev) => ({
            ...prev,
            step: 'configure',
            error: errorMsg,
          }));
        }
      } else {
        // Generate QR code
        const result = await generateQR({
          routerID,
          instanceID: instance.id,
          redactSecrets,
          includeRoutingRules,
          imageSize: qrImageSize,
        });

        const qrPayload = result.data?.generateConfigQR;
        if (qrPayload?.imageDataBase64) {
          setState((prev) => ({
            ...prev,
            step: 'complete',
            qrImageData: qrPayload.imageDataBase64!,
            downloadURL: qrPayload.downloadURL ?? undefined,
          }));
          onExportComplete?.('qr', qrPayload.downloadURL ?? '');
        } else {
          const errorMsg = qrPayload?.errors?.[0]?.message || 'QR generation failed';
          setState((prev) => ({
            ...prev,
            step: 'configure',
            error: errorMsg,
          }));
        }
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        step: 'configure',
        error: error instanceof Error ? error.message : 'Export failed',
      }));
    }
  }, [state.options, exportService, generateQR, routerID, instance.id, onExportComplete]);

  // Download file (JSON or QR PNG)
  const handleDownload = useCallback(() => {
    if (state.downloadURL) {
      window.open(state.downloadURL, '_blank');
    }
  }, [state.downloadURL]);

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    try {
      if (state.options.format === 'json' && state.downloadURL) {
        // Fetch JSON content and copy to clipboard
        const response = await fetch(state.downloadURL);
        const jsonText = await response.text();
        await navigator.clipboard.writeText(jsonText);
      } else if (state.options.format === 'qr' && state.qrImageData) {
        // Copy QR code image to clipboard
        const blob = await fetch(`data:image/png;base64,${state.qrImageData}`).then((r) =>
          r.blob()
        );
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
      }

      setState((prev) => ({ ...prev, copySuccess: true }));
      setTimeout(() => {
        setState((prev) => ({ ...prev, copySuccess: false }));
      }, 3000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, [state.downloadURL, state.qrImageData, state.options.format]);

  return {
    // State
    state,
    loading: exportLoading || qrLoading,

    // Instance info
    instance,

    // Actions
    setFormat,
    setOptions,
    handleExport,
    handleDownload,
    handleCopy,
    reset,
  };
}
