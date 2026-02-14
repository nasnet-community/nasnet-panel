/**
 * useServiceImportDialog - Headless hook for service import dialog
 * Contains all business logic for importing service configurations
 * Multi-step wizard: select → validate → resolve → importing → complete
 */

import { useState, useCallback } from 'react';
import { useImportService } from '@nasnet/api-client/queries/services';
import {
  validateImportPackageJSON,
  type ImportPackageData as ZodImportPackageData,
} from '@nasnet/features/services/schemas';
import type {
  ServiceImportDialogProps,
  ImportState,
  ImportSource,
  ConflictResolution,
  ImportPackageData,
} from './types';

export function useServiceImportDialog(props: ServiceImportDialogProps) {
  const { routerID, onImportComplete } = props;

  // Apollo hooks
  const { importService, loading } = useImportService();

  // Local state
  const [state, setState] = useState<ImportState>({
    step: 'select',
    source: 'paste',
    content: '',
    redactedFieldValues: {},
    deviceFilter: [],
    progress: 0,
  });

  // Reset state
  const reset = useCallback(() => {
    setState({
      step: 'select',
      source: 'paste',
      content: '',
      redactedFieldValues: {},
      deviceFilter: [],
      progress: 0,
    });
  }, []);

  // Set import source
  const setSource = useCallback((source: ImportSource) => {
    setState((prev) => ({ ...prev, source }));
  }, []);

  // Set content
  const setContent = useCallback((content: string) => {
    setState((prev) => ({ ...prev, content, error: undefined }));
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setContent(text);
    };
    reader.readAsText(file);
  }, [setContent]);

  // Parse and validate package
  const handleValidate = useCallback(async () => {
    if (!state.content.trim()) {
      setState((prev) => ({ ...prev, error: 'No content provided' }));
      return;
    }

    // Client-side validation with Zod
    const clientValidation = validateImportPackageJSON(state.content);

    if (!clientValidation.valid) {
      const errorMessages = clientValidation.errors?.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ');
      setState((prev) => ({
        ...prev,
        error: errorMessages || 'Invalid package format',
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      step: 'validate',
      packageData: clientValidation.data as unknown as ImportPackageData,
      error: undefined,
    }));

    // Backend validation (dry-run)
    try {
      const result = await importService({
        routerID,
        package: JSON.parse(state.content),
        dryRun: true,
      });

      if (result.data?.validationResult) {
        const validationResult = result.data.validationResult;

        if (validationResult.valid && !validationResult.requiresUserInput) {
          // Validation passed, no user input needed
          setState((prev) => ({
            ...prev,
            step: 'importing',
            validationResult,
          }));
          // Auto-proceed to import
          handleImport();
        } else if (validationResult.requiresUserInput || validationResult.errors.length > 0) {
          // Validation requires user input or has errors
          setState((prev) => ({
            ...prev,
            step: 'resolve',
            validationResult,
          }));
        }
      } else {
        setState((prev) => ({
          ...prev,
          step: 'select',
          error: result.data?.errors?.[0]?.message || 'Validation failed',
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        step: 'select',
        error: error instanceof Error ? error.message : 'Validation failed',
      }));
    }
  }, [state.content, routerID, importService]);

  // Set redacted field value
  const setRedactedFieldValue = useCallback((field: string, value: string) => {
    setState((prev) => ({
      ...prev,
      redactedFieldValues: {
        ...prev.redactedFieldValues,
        [field]: value,
      },
    }));
  }, []);

  // Set conflict resolution
  const setConflictResolution = useCallback((resolution: ConflictResolution) => {
    setState((prev) => ({ ...prev, conflictResolution: resolution }));
  }, []);

  // Toggle device filter
  const toggleDeviceFilter = useCallback((deviceMAC: string) => {
    setState((prev) => {
      const deviceFilter = prev.deviceFilter.includes(deviceMAC)
        ? prev.deviceFilter.filter((mac) => mac !== deviceMAC)
        : [...prev.deviceFilter, deviceMAC];
      return { ...prev, deviceFilter };
    });
  }, []);

  // Execute import
  const handleImport = useCallback(async () => {
    if (!state.packageData) {
      setState((prev) => ({ ...prev, error: 'No package data' }));
      return;
    }

    setState((prev) => ({ ...prev, step: 'importing', error: undefined, progress: 0 }));

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setState((prev) => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90),
        }));
      }, 300);

      const result = await importService({
        routerID,
        package: JSON.parse(state.content),
        dryRun: false,
        redactedFieldValues:
          Object.keys(state.redactedFieldValues).length > 0
            ? state.redactedFieldValues
            : undefined,
        conflictResolution: state.conflictResolution,
        deviceFilter: state.deviceFilter.length > 0 ? state.deviceFilter : undefined,
      });

      clearInterval(progressInterval);

      if (result.data?.valid) {
        setState((prev) => ({
          ...prev,
          step: 'complete',
          progress: 100,
          createdInstanceID: state.packageData?.service.instanceName, // Placeholder
        }));
        onImportComplete?.(state.packageData.service.instanceName);
      } else {
        setState((prev) => ({
          ...prev,
          step: 'resolve',
          error: result.data?.errors?.[0]?.message || 'Import failed',
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        step: 'resolve',
        error: error instanceof Error ? error.message : 'Import failed',
      }));
    }
  }, [
    state.packageData,
    state.content,
    state.redactedFieldValues,
    state.conflictResolution,
    state.deviceFilter,
    routerID,
    importService,
    onImportComplete,
  ]);

  return {
    // State
    state,
    loading,

    // Actions
    setSource,
    setContent,
    handleFileUpload,
    handleValidate,
    setRedactedFieldValue,
    setConflictResolution,
    toggleDeviceFilter,
    handleImport,
    reset,
  };
}
