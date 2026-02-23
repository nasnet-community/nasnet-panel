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
import { type ReactNode } from 'react';
import type { UseStepperReturn } from './hooks/use-stepper.types';
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
export declare function StepperProvider({ stepper, children }: StepperProviderProps): import("react/jsx-runtime").JSX.Element;
export declare namespace StepperProvider {
    var displayName: string;
}
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
export declare function useStepperContext(): UseStepperReturn;
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
export declare function useOptionalStepperContext(): UseStepperReturn | null;
//# sourceMappingURL=stepper-context.d.ts.map