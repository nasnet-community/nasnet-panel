/**
 * useTemplateInstallWizard Hook
 *
 * Headless hook for template installation wizard.
 * Manages XState machine, API calls, and subscriptions.
 */

import { useMachine } from '@xstate/react';
import { useCallback, useEffect } from 'react';
import {
  useInstallTemplate,
  useTemplateInstallProgress,
} from '@nasnet/api-client/queries';
import type { ServiceTemplate, TemplateInstallResult, TemplateInstallProgress } from '@nasnet/api-client/generated';

import { createTemplateInstallMachine } from './templateInstallMachine';
import type { TemplateInstallContext } from './templateInstallMachine';

/**
 * Options for useTemplateInstallWizard
 */
export interface UseTemplateInstallWizardOptions {
  /** Router ID */
  routerId: string;
  /** Template to install */
  template: ServiceTemplate;
  /** Callback when installation completes */
  onComplete?: (instanceIDs: string[]) => void;
  /** Callback when wizard is cancelled */
  onCancel?: () => void;
  /** Callback when installation fails */
  onError?: (error: string) => void;
}

/**
 * Return type for useTemplateInstallWizard
 *
 * Provides access to wizard state machine, navigation, and installation progress.
 */
export interface UseTemplateInstallWizardReturn {
  /** Current XState machine state */
  state: any;
  /** Machine context containing installation data */
  context: TemplateInstallContext;
  /** Send event to state machine */
  send: (event: any) => void;
  /** Current step number (1-4) */
  currentStep: number;
  /** Whether user can navigate to next step */
  canGoNext: boolean;
  /** Whether user can navigate to previous step */
  canGoPrev: boolean;
  /** Whether installation is currently in progress */
  isInstalling: boolean;
  /** Whether installation completed successfully */
  isCompleted: boolean;
  /** Whether wizard was cancelled by user */
  isCancelled: boolean;
  /** Whether installation encountered errors */
  isFailed: boolean;
}

/**
 * Hook for template installation wizard
 *
 * Integrates XState machine with API mutations and subscriptions.
 *
 * @example
 * ```tsx
 * const {
 *   currentStep,
 *   context,
 *   send,
 *   canGoNext,
 *   isInstalling,
 * } = useTemplateInstallWizard({
 *   routerId: 'router-1',
 *   template,
 *   onComplete: (instanceIDs) => {
 *     toast.success(`Installed ${instanceIDs.length} services`);
 *   },
 * });
 * ```
 */
export function useTemplateInstallWizard(
  options: UseTemplateInstallWizardOptions
): UseTemplateInstallWizardReturn {
  const { routerId, template, onComplete, onCancel, onError } = options;

  // Create machine with initial context
  const machine = createTemplateInstallMachine({
    routerId,
    template,
    templateId: template.id,
  });

  const [state, send] = useMachine(machine);

  // Install mutation
  const { installTemplate, loading: installLoading } = useInstallTemplate({
    onCompleted: useCallback(
      (result: TemplateInstallResult) => {
        if (result.success) {
          send({
            type: 'INSTALL_COMPLETE',
            result: {
              success: true,
              instanceIDs: [...(result.instanceIDs || [])],
              errors: [...(result.errors || [])],
            },
          });
          if (onComplete) {
            onComplete([...(result.instanceIDs || [])]);
          }
        } else {
          send({
            type: 'INSTALL_FAILED',
            error: result.errors?.[0] || 'Installation failed',
          });
          if (onError) {
            onError(result.errors?.[0] || 'Installation failed');
          }
        }
      },
      [send, onComplete, onError]
    ),
    onError: useCallback(
      (error: Error) => {
        send({ type: 'INSTALL_FAILED', error: error.message });
        if (onError) {
          onError(error.message);
        }
      },
      [send, onError]
    ),
  });

  // Progress subscription (only when installing)
  const { progress } = useTemplateInstallProgress({
    routerID: routerId,
    enabled: state.matches('installing'),
    onCompleted: useCallback((progressData: TemplateInstallProgress) => {
      // Installation completed via subscription
    }, []),
    onFailed: useCallback(
      (progressData: TemplateInstallProgress) => {
        send({
          type: 'INSTALL_FAILED',
          error: progressData.errorMessage || 'Installation failed',
        });
      },
      [send]
    ),
  });

  // Update progress in context
  useEffect(() => {
    if (progress && state.matches('installing')) {
      send({
        type: 'PROGRESS_UPDATE',
        progress: {
          phase: progress.status,
          current: progress.installedCount,
          total: progress.totalServices,
          currentService: progress.currentService ?? null,
        },
      });
    }
  }, [progress, send, state]);

  // Start installation when entering installing state
  useEffect(() => {
    if (state.matches('installing') && !installLoading) {
      installTemplate({
        routerID: routerId,
        templateID: template.id,
        variables: state.context.variables,
        dryRun: false,
      });
    }
  }, [state, routerId, template.id, installTemplate, installLoading]);

  // Handle cancellation
  useEffect(() => {
    if (state.matches('cancelled') && onCancel) {
      onCancel();
    }
  }, [state, onCancel]);

  return {
    state,
    context: state.context,
    send,
    currentStep: state.context.currentStep,
    canGoNext: state.can({ type: 'NEXT' }),
    canGoPrev: state.can({ type: 'PREV' }),
    isInstalling: state.matches('installing'),
    isCompleted: state.matches('completed'),
    isCancelled: state.matches('cancelled'),
    isFailed: state.matches('failed'),
  };
}
