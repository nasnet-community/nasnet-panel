/**
 * useTemplateInstallWizard Hook
 *
 * Headless hook for template installation wizard.
 * Manages XState machine, API calls, and subscriptions.
 */

import { useMachine } from '@xstate/react';
import { useEffect } from 'react';
import {
  useInstallTemplate,
  useTemplateInstallProgress,
} from '@nasnet/api-client/queries';
import type { ServiceTemplate } from '@nasnet/api-client/generated';

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
 */
export interface UseTemplateInstallWizardReturn {
  /** Current state */
  state: any;
  /** Machine context */
  context: TemplateInstallContext;
  /** Send event to machine */
  send: (event: any) => void;
  /** Current step number (1-4) */
  currentStep: number;
  /** Whether can navigate to next step */
  canGoNext: boolean;
  /** Whether can navigate to previous step */
  canGoPrev: boolean;
  /** Whether installation is in progress */
  isInstalling: boolean;
  /** Whether installation completed successfully */
  isCompleted: boolean;
  /** Whether wizard was cancelled */
  isCancelled: boolean;
  /** Whether installation failed */
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
    onCompleted: (result) => {
      if (result.success) {
        send({
          type: 'INSTALL_COMPLETE',
          result: {
            success: true,
            instanceIDs: result.instanceIDs,
            errors: result.errors || [],
          },
        });
        if (onComplete) {
          onComplete(result.instanceIDs);
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
    onError: (error) => {
      send({ type: 'INSTALL_FAILED', error: error.message });
      if (onError) {
        onError(error.message);
      }
    },
  });

  // Progress subscription (only when installing)
  const { progress } = useTemplateInstallProgress({
    routerId,
    enabled: state.matches('installing'),
    onCompleted: (progressData) => {
      console.log('Installation completed:', progressData);
    },
    onFailed: (progressData) => {
      send({
        type: 'INSTALL_FAILED',
        error: progressData.errorMessage || 'Installation failed',
      });
    },
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
          currentService: progress.currentService,
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
