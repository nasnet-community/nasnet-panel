/**
 * Stepper Context
 *
 * Context provider for sharing stepper state with presenter components.
 * Allows nested components to access stepper state without prop drilling.
 *
 * @see NAS-4A.14: Build Headless Stepper Hook
 *
 * @example
 * ```tsx
 * // Root component
 * function SetupWizard() {
 *   const stepper = useStepper(config);
 *
 *   return (
 *     <StepperProvider stepper={stepper}>
 *       <StepList />
 *       <StepContent />
 *       <StepperNavigation />
 *     </StepperProvider>
 *   );
 * }
 *
 * // Child component
 * function StepList() {
 *   const stepper = useStepperContext();
 *
 *   return (
 *     <nav>
 *       {stepper.steps.map((step, index) => (
 *         <StepItem key={step.id} step={step} index={index} />
 *       ))}
 *     </nav>
 *   );
 * }
 * ```
 */

import { createContext, useContext, type ReactNode } from 'react';
import type { UseStepperReturn } from './hooks/use-stepper.types';

// ===== Context =====

const StepperContext = createContext<UseStepperReturn | null>(null);

// ===== Provider =====

/**
 * Props for StepperProvider
 */
export interface StepperProviderProps {
  /** Stepper instance from useStepper */
  stepper: UseStepperReturn;
  /** Child components */
  children: ReactNode;
}

/**
 * Provider component for sharing stepper state
 *
 * @param props - Provider props
 * @returns Provider element
 *
 * @example
 * ```tsx
 * const stepper = useStepper(config);
 *
 * return (
 *   <StepperProvider stepper={stepper}>
 *     <YourStepperUI />
 *   </StepperProvider>
 * );
 * ```
 */
export function StepperProvider({ stepper, children }: StepperProviderProps) {
  return (
    <StepperContext.Provider value={stepper}>
      {children}
    </StepperContext.Provider>
  );
}

// ===== Hooks =====

/**
 * Hook to access stepper context
 *
 * @throws Error if used outside of StepperProvider
 * @returns Stepper instance
 *
 * @example
 * ```tsx
 * function StepItem({ index }: { index: number }) {
 *   const stepper = useStepperContext();
 *   const step = stepper.steps[index];
 *   const status = stepper.getStepStatus(step.id);
 *
 *   return (
 *     <button onClick={() => stepper.goTo(index)}>
 *       {step.title}
 *     </button>
 *   );
 * }
 * ```
 */
export function useStepperContext(): UseStepperReturn {
  const context = useContext(StepperContext);

  if (!context) {
    throw new Error(
      'useStepperContext must be used within a StepperProvider. ' +
        'Wrap your component tree with <StepperProvider stepper={...}>.'
    );
  }

  return context;
}

/**
 * Hook to optionally access stepper context
 *
 * Unlike useStepperContext, this hook returns null if used outside of StepperProvider.
 * Useful for components that can work with or without a stepper context.
 *
 * @returns Stepper instance or null
 *
 * @example
 * ```tsx
 * function OptionalStepIndicator() {
 *   const stepper = useOptionalStepperContext();
 *
 *   if (!stepper) {
 *     return null; // No stepper context, don't render
 *   }
 *
 *   return (
 *     <span>Step {stepper.currentIndex + 1} of {stepper.totalSteps}</span>
 *   );
 * }
 * ```
 */
export function useOptionalStepperContext(): UseStepperReturn | null {
  return useContext(StepperContext);
}

// ===== Display Name =====

StepperProvider.displayName = 'StepperProvider';
