/**
 * useTemplateInstallWizard Hook
 *
 * Headless hook for template installation wizard.
 * Manages XState machine, API calls, and subscriptions.
 */
import type { ServiceTemplate } from '@nasnet/api-client/generated';
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
export declare function useTemplateInstallWizard(options: UseTemplateInstallWizardOptions): UseTemplateInstallWizardReturn;
//# sourceMappingURL=useTemplateInstallWizard.d.ts.map