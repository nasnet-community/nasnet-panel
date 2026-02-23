/**
 * useWizardPersistence Hook
 *
 * Persists multi-step wizard state including step data, current step,
 * and completed steps. Supports TTL expiration and progress recovery.
 *
 * @module @nasnet/core/forms/useWizardPersistence
 */
import type { FieldValues } from 'react-hook-form';
/**
 * Persisted wizard state structure
 */
export interface WizardPersistedState<TStepData extends Record<string, FieldValues>> {
    /** Data for each step keyed by step ID */
    stepData: Partial<TStepData>;
    /** Current step index or ID */
    currentStep: string | number;
    /** Array of completed step IDs */
    completedSteps: string[];
    /** When the wizard was started */
    startedAt: number;
    /** When the state was last updated */
    updatedAt: number;
    /** Optional wizard metadata */
    metadata?: Record<string, unknown>;
}
/**
 * Options for useWizardPersistence
 */
export interface UseWizardPersistenceOptions<TStepData extends Record<string, FieldValues>> {
    /** Unique key for this wizard's storage */
    storageKey: string;
    /** Step IDs in order */
    stepIds: string[];
    /** Initial step (defaults to first step) */
    initialStep?: string | number;
    /** Storage implementation (defaults to sessionStorage) */
    storage?: Storage;
    /** Time-to-live in milliseconds (default: 24 hours) */
    ttlMs?: number;
    /** Callback when state is restored */
    onRestore?: (state: WizardPersistedState<TStepData>) => void;
    /** Callback when state expires */
    onExpire?: () => void;
}
/**
 * Return type for useWizardPersistence
 */
export interface UseWizardPersistenceReturn<TStepData extends Record<string, FieldValues>> {
    /** Current wizard state */
    state: WizardPersistedState<TStepData>;
    /** Whether there was restored data */
    wasRestored: boolean;
    /** Current step ID */
    currentStep: string;
    /** Current step index (0-based) */
    currentStepIndex: number;
    /** Array of completed step IDs */
    completedSteps: string[];
    /** Progress percentage (0-100) */
    progress: number;
    /** Whether the wizard is on the last step */
    isLastStep: boolean;
    /** Whether the wizard is on the first step */
    isFirstStep: boolean;
    /** Get data for a specific step */
    getStepData: <K extends keyof TStepData>(stepId: K) => TStepData[K] | undefined;
    /** Set data for a specific step */
    setStepData: <K extends keyof TStepData>(stepId: K, data: TStepData[K]) => void;
    /** Mark a step as completed */
    completeStep: (stepId: string) => void;
    /** Navigate to a specific step */
    goToStep: (stepId: string | number) => void;
    /** Go to next step */
    nextStep: () => void;
    /** Go to previous step */
    prevStep: () => void;
    /** Check if a step is completed */
    isStepCompleted: (stepId: string) => boolean;
    /** Check if can navigate to a step */
    canGoToStep: (stepId: string) => boolean;
    /** Reset wizard to initial state */
    reset: () => void;
    /** Clear all persisted data */
    clearPersistence: () => void;
    /** Get aggregated data from all steps */
    getAllStepData: () => Partial<TStepData>;
    /** Update metadata */
    setMetadata: (metadata: Record<string, unknown>) => void;
}
/**
 * Hook for persisting multi-step wizard state.
 *
 * Handles:
 * - Step data persistence for each wizard step
 * - Current step tracking and navigation
 * - Completed steps tracking
 * - Progress calculation
 * - TTL expiration
 * - State restoration on page reload
 *
 * @example
 * ```tsx
 * type WizardData = {
 *   basic: { name: string; description: string };
 *   network: { address: string; port: number };
 *   security: { password: string; twoFactor: boolean };
 * };
 *
 * function VPNWizard() {
 *   const wizard = useWizardPersistence<WizardData>({
 *     storageKey: 'vpn-setup-wizard',
 *     stepIds: ['basic', 'network', 'security'],
 *     ttlMs: 60 * 60 * 1000, // 1 hour
 *   });
 *
 *   const handleStepComplete = (stepId: string, data: any) => {
 *     wizard.setStepData(stepId, data);
 *     wizard.completeStep(stepId);
 *     wizard.nextStep();
 *   };
 *
 *   const handleSubmit = () => {
 *     const allData = wizard.getAllStepData();
 *     // Submit allData to backend
 *     wizard.clearPersistence();
 *   };
 *
 *   return (
 *     <>
 *       {wizard.wasRestored && <Alert>Progress restored</Alert>}
 *       <ProgressBar value={wizard.progress} />
 *       <WizardStep step={wizard.currentStep} />
 *     </>
 *   );
 * }
 * ```
 */
export declare function useWizardPersistence<TStepData extends Record<string, FieldValues>>(options: UseWizardPersistenceOptions<TStepData>): UseWizardPersistenceReturn<TStepData>;
//# sourceMappingURL=useWizardPersistence.d.ts.map