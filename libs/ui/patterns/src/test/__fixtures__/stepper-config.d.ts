/**
 * Stepper Configuration Test Fixtures
 *
 * Test configurations for stepper variants testing.
 * Includes step configurations for all stepper patterns.
 *
 * @module @nasnet/ui/patterns/test/__fixtures__/stepper-config
 * @see NAS-4A.24: Implement Component Tests and Visual Regression
 */
export interface StepConfig {
    id: string;
    title: string;
    description?: string;
    icon?: string;
    validate?: () => Promise<{
        valid: boolean;
        errors?: Record<string, string>;
    }>;
    canSkip?: boolean;
}
export interface StepperConfig {
    steps: StepConfig[];
    initialStep?: number;
    freeNavigation?: boolean;
    validateOnChange?: boolean;
    onStepChange?: (from: number, to: number) => void;
    onComplete?: (data: Map<string, unknown>) => void;
}
/**
 * Creates a basic step configuration.
 */
export declare function createStep(id: string, title: string, options?: Partial<StepConfig>): StepConfig;
/**
 * Creates a stepper configuration.
 */
export declare function createConfig(steps: StepConfig[], options?: Partial<Omit<StepperConfig, 'steps'>>): StepperConfig;
/**
 * Creates a validation function that always passes.
 */
export declare function createPassingValidation(): import("vitest").Mock<any, any>;
/**
 * Creates a validation function that always fails.
 */
export declare function createFailingValidation(errors?: Record<string, string>): import("vitest").Mock<any, any>;
/**
 * Creates a validation function that fails on first call, then passes.
 */
export declare function createFailThenPassValidation(errors?: Record<string, string>): import("vitest").Mock<any, any>;
export declare const basicSteps: StepConfig[];
export declare const twoSteps: StepConfig[];
export declare const singleStep: StepConfig[];
export declare const manySteps: StepConfig[];
export declare const stepsWithValidation: StepConfig[];
export declare const stepsWithFailingValidation: StepConfig[];
export declare const stepsWithSkip: StepConfig[];
export declare const allSkippableSteps: StepConfig[];
export declare const networkSetupWizard: StepConfig[];
export declare const vpnSetupWizard: StepConfig[];
export declare const firewallRuleWizard: StepConfig[];
/**
 * Creates mock onStepChange callback for testing.
 */
export declare function createOnStepChange(): import("vitest").Mock<[from: number, to: number], void>;
/**
 * Creates mock onComplete callback for testing.
 */
export declare function createOnComplete(): import("vitest").Mock<[data: Map<string, unknown>], void>;
/**
 * Creates a full stepper config with all callbacks mocked.
 */
export declare function createFullConfig(steps?: StepConfig[]): StepperConfig & {
    onStepChange: ReturnType<typeof createOnStepChange>;
    onComplete: ReturnType<typeof createOnComplete>;
};
//# sourceMappingURL=stepper-config.d.ts.map