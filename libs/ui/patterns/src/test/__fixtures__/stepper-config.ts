/**
 * Stepper Configuration Test Fixtures
 *
 * Test configurations for stepper variants testing.
 * Includes step configurations for all stepper patterns.
 *
 * @module @nasnet/ui/patterns/test/__fixtures__/stepper-config
 * @see NAS-4A.24: Implement Component Tests and Visual Regression
 */

import { vi } from 'vitest';

// ============================================================================
// Type Definitions
// ============================================================================

export interface StepConfig {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  validate?: () => Promise<{ valid: boolean; errors?: Record<string, string> }>;
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

// ============================================================================
// Step Configuration Helpers
// ============================================================================

/**
 * Creates a basic step configuration.
 */
export function createStep(
  id: string,
  title: string,
  options?: Partial<StepConfig>
): StepConfig {
  return {
    id,
    title,
    ...options,
  };
}

/**
 * Creates a stepper configuration.
 */
export function createConfig(
  steps: StepConfig[],
  options?: Partial<Omit<StepperConfig, 'steps'>>
): StepperConfig {
  return {
    steps,
    ...options,
  };
}

/**
 * Creates a validation function that always passes.
 */
export function createPassingValidation() {
  return vi.fn().mockResolvedValue({ valid: true });
}

/**
 * Creates a validation function that always fails.
 */
export function createFailingValidation(errors: Record<string, string> = { field: 'Error' }) {
  return vi.fn().mockResolvedValue({ valid: false, errors });
}

/**
 * Creates a validation function that fails on first call, then passes.
 */
export function createFailThenPassValidation(errors: Record<string, string> = { field: 'Error' }) {
  let called = false;
  return vi.fn().mockImplementation(() => {
    if (!called) {
      called = true;
      return Promise.resolve({ valid: false, errors });
    }
    return Promise.resolve({ valid: true });
  });
}

// ============================================================================
// Basic Step Configurations
// ============================================================================

export const basicSteps: StepConfig[] = [
  createStep('step1', 'Step 1', { description: 'First step description' }),
  createStep('step2', 'Step 2', { description: 'Second step description' }),
  createStep('step3', 'Step 3', { description: 'Third step description' }),
];

export const twoSteps: StepConfig[] = [
  createStep('step1', 'First Step'),
  createStep('step2', 'Second Step'),
];

export const singleStep: StepConfig[] = [
  createStep('only', 'Only Step'),
];

export const manySteps: StepConfig[] = Array.from({ length: 10 }, (_, i) =>
  createStep(`step${i + 1}`, `Step ${i + 1}`, { description: `Description for step ${i + 1}` })
);

// ============================================================================
// Steps with Validation
// ============================================================================

export const stepsWithValidation: StepConfig[] = [
  createStep('step1', 'Personal Info', {
    description: 'Enter your personal information',
    validate: createPassingValidation(),
  }),
  createStep('step2', 'Contact Details', {
    description: 'Enter your contact information',
    validate: createPassingValidation(),
  }),
  createStep('step3', 'Review', {
    description: 'Review and confirm',
  }),
];

export const stepsWithFailingValidation: StepConfig[] = [
  createStep('step1', 'Invalid Step', {
    validate: createFailingValidation({ name: 'Name is required', email: 'Email is invalid' }),
  }),
  createStep('step2', 'Next Step'),
];

// ============================================================================
// Steps with Skip
// ============================================================================

export const stepsWithSkip: StepConfig[] = [
  createStep('step1', 'Required Step'),
  createStep('step2', 'Optional Step', {
    description: 'This step can be skipped',
    canSkip: true,
  }),
  createStep('step3', 'Final Step'),
];

export const allSkippableSteps: StepConfig[] = [
  createStep('step1', 'Optional 1', { canSkip: true }),
  createStep('step2', 'Optional 2', { canSkip: true }),
  createStep('step3', 'Optional 3', { canSkip: true }),
];

// ============================================================================
// Wizard Configurations
// ============================================================================

export const networkSetupWizard: StepConfig[] = [
  createStep('interface', 'Select Interface', {
    description: 'Choose the network interface to configure',
    icon: 'Network',
  }),
  createStep('ip', 'IP Configuration', {
    description: 'Configure IP address and subnet',
    icon: 'Globe',
    validate: createPassingValidation(),
  }),
  createStep('gateway', 'Gateway & DNS', {
    description: 'Set gateway and DNS servers',
    icon: 'Server',
    validate: createPassingValidation(),
  }),
  createStep('review', 'Review & Apply', {
    description: 'Review settings before applying',
    icon: 'CheckCircle',
  }),
];

export const vpnSetupWizard: StepConfig[] = [
  createStep('type', 'VPN Type', {
    description: 'Select the type of VPN connection',
    icon: 'Shield',
  }),
  createStep('server', 'Server Configuration', {
    description: 'Enter VPN server details',
    icon: 'Server',
    validate: createPassingValidation(),
  }),
  createStep('auth', 'Authentication', {
    description: 'Configure authentication method',
    icon: 'Key',
    validate: createPassingValidation(),
  }),
  createStep('advanced', 'Advanced Options', {
    description: 'Configure advanced settings',
    icon: 'Settings',
    canSkip: true,
  }),
  createStep('test', 'Test Connection', {
    description: 'Test and verify the VPN connection',
    icon: 'CheckCircle',
  }),
];

export const firewallRuleWizard: StepConfig[] = [
  createStep('chain', 'Select Chain', {
    description: 'Choose the firewall chain',
    icon: 'Link',
  }),
  createStep('action', 'Rule Action', {
    description: 'Select accept, drop, or reject',
    icon: 'Activity',
  }),
  createStep('match', 'Match Conditions', {
    description: 'Define matching criteria',
    icon: 'Filter',
    validate: createPassingValidation(),
  }),
  createStep('schedule', 'Schedule', {
    description: 'Optional: Set active hours',
    icon: 'Clock',
    canSkip: true,
  }),
  createStep('review', 'Review Rule', {
    description: 'Review before creating',
    icon: 'Eye',
  }),
];

// ============================================================================
// Stepper Test Utilities
// ============================================================================

/**
 * Creates mock onStepChange callback for testing.
 */
export function createOnStepChange() {
  return vi.fn<[number, number], void>();
}

/**
 * Creates mock onComplete callback for testing.
 */
export function createOnComplete() {
  return vi.fn<[Map<string, unknown>], void>();
}

/**
 * Creates a full stepper config with all callbacks mocked.
 */
export function createFullConfig(
  steps: StepConfig[] = basicSteps
): StepperConfig & {
  onStepChange: ReturnType<typeof vi.fn>;
  onComplete: ReturnType<typeof vi.fn>;
} {
  const onStepChange = createOnStepChange();
  const onComplete = createOnComplete();

  return {
    steps,
    onStepChange,
    onComplete,
  };
}
