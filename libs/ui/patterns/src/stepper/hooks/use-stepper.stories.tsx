/**
 * useStepper Hook Storybook Stories
 *
 * Documentation and examples for the headless stepper hook that
 * manages step navigation, validation, and state for wizard flows.
 *
 * @module @nasnet/ui/patterns/stepper/hooks/use-stepper
 * @see NAS-4A.14: Build Headless Stepper Hook
 * @see ADR-018: Headless + Platform Presenters
 */

import * as React from 'react';
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect, waitFor } from 'storybook/test';

import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@nasnet/ui/primitives';
import { useStepper } from './use-stepper';
import type { StepConfig, ValidationResult } from './use-stepper.types';

// ===== Meta Configuration =====

/**
 * useStepper is a headless hook that manages all step navigation, validation, and state
 * for multi-step wizard flows. It follows the Headless + Platform Presenter pattern (ADR-018).
 *
 * ## Key Features
 *
 * - ✅ Step navigation (next, prev, goTo)
 * - ✅ Async validation with Zod schema support
 * - ✅ Step data persistence
 * - ✅ Progress tracking
 * - ✅ Error state management
 * - ✅ Skip step support
 * - ✅ Free navigation mode
 * - ✅ Complete callback with all step data
 *
 * ## Migration from Qwik
 *
 * | Qwik Pattern | React Pattern |
 * |--------------|---------------|
 * | `useStore({ currentStep: 0 })` | `useStepper({ steps: [...] })` |
 * | `store.currentStep++` | `stepper.next()` |
 * | `useComputed$(() => ...)` | Derived values in hook return |
 * | `useTask$()` | Async validation in step config |
 *
 * ## Accessibility
 *
 * The hook provides all necessary state for accessible stepper UIs:
 * - `currentIndex` for `aria-current="step"`
 * - `isCompleted()` for completion announcements
 * - `errors` for `aria-invalid` and error messages
 * - `progress` for `role="progressbar"`
 *
 * @see VStepper - Vertical stepper presenter
 * @see HStepper - Horizontal stepper presenter
 * @see CStepper - Content stepper with preview
 * @see MiniStepper - Mobile stepper presenter
 */
const meta: Meta = {
  title: 'Patterns/Stepper/useStepper',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# useStepper Hook

Headless hook for managing multi-step wizard flows. Contains all business logic
for step navigation, validation, and state management.

## Usage

\`\`\`tsx
import { useStepper, VStepper } from '@nasnet/ui/patterns';

const stepper = useStepper({
  steps: [
    { id: 'wan', title: 'WAN Setup', validate: validateWan },
    { id: 'lan', title: 'LAN Setup', validate: validateLan },
    { id: 'review', title: 'Review' },
  ],
  onComplete: (data) => console.log('Done!', data),
});

return <VStepper stepper={stepper} />;
\`\`\`

## API Reference

### Config Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| \`steps\` | \`StepConfig[]\` | Yes | Array of step configurations |
| \`onComplete\` | \`(data: Map) => void\` | No | Called when wizard completes |
| \`onStepChange\` | \`(from, to) => void\` | No | Called on step navigation |
| \`validateOnChange\` | \`boolean\` | No | Validate before navigation (default: true) |
| \`initialStep\` | \`number\` | No | Starting step index (default: 0) |
| \`freeNavigation\` | \`boolean\` | No | Allow jumping to any step (default: false) |

### Return Values

| Property | Type | Description |
|----------|------|-------------|
| \`currentStep\` | \`StepConfig\` | Current step configuration |
| \`currentIndex\` | \`number\` | Zero-based step index |
| \`steps\` | \`StepConfig[]\` | All step configurations |
| \`next\` | \`() => Promise<boolean>\` | Advance to next step (validates first) |
| \`prev\` | \`() => void\` | Go to previous step |
| \`goTo\` | \`(index) => Promise<boolean>\` | Jump to specific step |
| \`skip\` | \`() => boolean\` | Skip current step (if allowed) |
| \`canProceed\` | \`boolean\` | Can advance (not validating) |
| \`isFirst\` | \`boolean\` | On first step |
| \`isLast\` | \`boolean\` | On last step |
| \`isValidating\` | \`boolean\` | Validation in progress |
| \`isCompleted\` | \`boolean\` | Wizard completed |
| \`errors\` | \`Record<string, string>\` | Current step errors |
| \`progress\` | \`number\` | Completion percentage (0-100) |
| \`completedCount\` | \`number\` | Number of completed steps |
| \`totalSteps\` | \`number\` | Total step count |
| \`getStepData\` | \`(id) => T\` | Get data for a step |
| \`setStepData\` | \`(data) => void\` | Set current step data |
| \`reset\` | \`() => void\` | Reset to initial state |

### StepConfig

\`\`\`typescript
interface StepConfig {
  id: string;           // Unique step identifier
  title: string;        // Display title
  description?: string; // Optional description
  icon?: string;        // Icon name for UI
  canSkip?: boolean;    // Allow skipping this step
  validate?: (data) => Promise<ValidationResult>;
}
\`\`\`
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ===== Test Data =====

const basicSteps: StepConfig[] = [
  { id: 'wan', title: 'WAN Configuration', description: 'Configure external network' },
  { id: 'lan', title: 'LAN Setup', description: 'Configure internal network' },
  { id: 'review', title: 'Review', description: 'Review and apply' },
];

const stepsWithValidation: StepConfig[] = [
  {
    id: 'wan',
    title: 'WAN Configuration',
    description: 'Configure external network',
    validate: async (data: unknown): Promise<ValidationResult> => {
      const formData = data as { ip?: string } | undefined;
      if (!formData?.ip) {
        return { valid: false, errors: { ip: 'IP address is required' } };
      }
      if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(formData.ip)) {
        return { valid: false, errors: { ip: 'Invalid IP address format' } };
      }
      return { valid: true };
    },
  },
  {
    id: 'lan',
    title: 'LAN Setup',
    description: 'Configure internal network',
    validate: async (data: unknown): Promise<ValidationResult> => {
      const formData = data as { subnet?: string } | undefined;
      if (!formData?.subnet) {
        return { valid: false, errors: { subnet: 'Subnet is required' } };
      }
      return { valid: true };
    },
  },
  { id: 'review', title: 'Review', description: 'Review and apply' },
];

// ===== Basic Usage =====

/**
 * Basic 3-step wizard demonstrating core navigation functionality.
 */
export const BasicUsage: Story = {
  render: () => {
    function BasicWizard() {
      const stepper = useStepper({
        steps: basicSteps,
        onComplete: (data) => {
          console.log('Wizard completed!', data);
          alert('Wizard completed!');
        },
      });

      return (
        <Card className="w-[500px]">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{stepper.currentStep.title}</span>
              <span className="text-sm text-muted-foreground">
                Step {stepper.currentIndex + 1} of {stepper.totalSteps}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {stepper.currentStep.description}
            </p>

            {/* Progress indicator */}
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${stepper.progress}%` }}
              />
            </div>

            {/* Step content placeholder */}
            <div className="min-h-[100px] p-4 border rounded-lg bg-muted/20">
              <p className="text-sm text-muted-foreground">
                Step content for "{stepper.currentStep.id}" goes here
              </p>
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={stepper.prev}
                disabled={stepper.isFirst}
              >
                Back
              </Button>
              <Button onClick={() => stepper.next()}>
                {stepper.isLast ? 'Complete' : 'Next'}
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return <BasicWizard />;
  },
};

// ===== With Validation =====

/**
 * Wizard with async validation on each step. Shows error handling.
 */
export const WithValidation: Story = {
  render: () => {
    function ValidationWizard() {
      const stepper = useStepper({
        steps: stepsWithValidation,
        onComplete: (data) => {
          console.log('Wizard completed with data:', data);
          alert('Wizard completed!');
        },
      });

      return (
        <Card className="w-[500px]">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{stepper.currentStep.title}</span>
              <span className="text-sm text-muted-foreground">
                {stepper.progress}% complete
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step-specific forms */}
            {stepper.currentStep.id === 'wan' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">WAN IP Address</label>
                <Input
                  placeholder="192.168.1.1"
                  defaultValue={(stepper.getStepData('wan') as { ip?: string })?.ip ?? ''}
                  onChange={(e) => stepper.setStepData({ ip: e.target.value })}
                  className={stepper.errors.ip ? 'border-destructive' : ''}
                />
                {stepper.errors.ip && (
                  <p className="text-sm text-destructive">{stepper.errors.ip}</p>
                )}
              </div>
            )}

            {stepper.currentStep.id === 'lan' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">LAN Subnet</label>
                <Input
                  placeholder="192.168.0.0/24"
                  defaultValue={(stepper.getStepData('lan') as { subnet?: string })?.subnet ?? ''}
                  onChange={(e) => stepper.setStepData({ subnet: e.target.value })}
                  className={stepper.errors.subnet ? 'border-destructive' : ''}
                />
                {stepper.errors.subnet && (
                  <p className="text-sm text-destructive">{stepper.errors.subnet}</p>
                )}
              </div>
            )}

            {stepper.currentStep.id === 'review' && (
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>WAN IP:</strong>{' '}
                  {(stepper.getStepData('wan') as { ip?: string })?.ip ?? 'Not set'}
                </p>
                <p className="text-sm">
                  <strong>LAN Subnet:</strong>{' '}
                  {(stepper.getStepData('lan') as { subnet?: string })?.subnet ?? 'Not set'}
                </p>
              </div>
            )}

            {/* Validation status */}
            {stepper.isValidating && (
              <p className="text-sm text-muted-foreground">Validating...</p>
            )}

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={stepper.prev}
                disabled={stepper.isFirst}
              >
                Back
              </Button>
              <Button
                onClick={() => stepper.next()}
                disabled={stepper.isValidating}
              >
                {stepper.isLast ? 'Complete' : 'Next'}
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return <ValidationWizard />;
  },
};

// ===== Skip Steps =====

/**
 * Wizard allowing optional step skipping.
 */
export const WithSkipSteps: Story = {
  render: () => {
    function SkipWizard() {
      const stepper = useStepper({
        steps: [
          { id: 'required', title: 'Required Step', canSkip: false },
          { id: 'optional', title: 'Optional Step', canSkip: true },
          { id: 'review', title: 'Review', canSkip: false },
        ],
        onComplete: () => alert('Done!'),
      });

      const currentCanSkip = stepper.steps[stepper.currentIndex].canSkip;

      return (
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>{stepper.currentStep.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This step is {currentCanSkip ? 'optional' : 'required'}.
            </p>

            <div className="flex gap-2">
              <Button variant="outline" onClick={stepper.prev} disabled={stepper.isFirst}>
                Back
              </Button>
              {currentCanSkip && (
                <Button variant="outline" onClick={stepper.skip}>
                  Skip
                </Button>
              )}
              <Button onClick={() => stepper.next()}>
                {stepper.isLast ? 'Complete' : 'Next'}
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return <SkipWizard />;
  },
};

// ===== Free Navigation =====

/**
 * Wizard with free navigation - can jump to any step.
 */
export const FreeNavigation: Story = {
  render: () => {
    function FreeNavWizard() {
      const stepper = useStepper({
        steps: basicSteps,
        freeNavigation: true,
        onComplete: () => alert('Done!'),
      });

      return (
        <Card className="w-[500px]">
          <CardHeader>
            <CardTitle>Free Navigation Mode</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step buttons - all accessible */}
            <div className="flex gap-2">
              {stepper.steps.map((step, index) => (
                <Button
                  key={step.id}
                  variant={index === stepper.currentIndex ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => stepper.goTo(index)}
                >
                  {step.title}
                </Button>
              ))}
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-medium">{stepper.currentStep.title}</h3>
              <p className="text-sm text-muted-foreground">
                {stepper.currentStep.description}
              </p>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={stepper.prev} disabled={stepper.isFirst}>
                Back
              </Button>
              <Button onClick={() => stepper.next()}>
                {stepper.isLast ? 'Complete' : 'Next'}
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return <FreeNavWizard />;
  },
};

// ===== Progress Tracking =====

/**
 * Demonstrates progress tracking features.
 */
export const ProgressTracking: Story = {
  render: () => {
    function ProgressWizard() {
      const stepper = useStepper({
        steps: [
          { id: 'step1', title: 'Step 1' },
          { id: 'step2', title: 'Step 2' },
          { id: 'step3', title: 'Step 3' },
          { id: 'step4', title: 'Step 4' },
          { id: 'step5', title: 'Step 5' },
        ],
        onComplete: () => alert('All steps complete!'),
      });

      return (
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Progress Tracking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">
                {stepper.progress}%
              </div>
              <div className="text-sm text-muted-foreground">
                {stepper.completedCount} of {stepper.totalSteps} steps completed
              </div>
            </div>

            <div className="w-full bg-muted rounded-full h-3">
              <div
                className="bg-primary h-3 rounded-full transition-all duration-300"
                style={{ width: `${stepper.progress}%` }}
                role="progressbar"
                aria-valuenow={stepper.progress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>

            <div className="text-center">
              <p className="font-medium">{stepper.currentStep.title}</p>
              <p className="text-xs text-muted-foreground">
                Step {stepper.currentIndex + 1}
              </p>
            </div>

            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={stepper.prev} disabled={stepper.isFirst}>
                Back
              </Button>
              <Button onClick={() => stepper.next()}>
                {stepper.isLast ? 'Finish' : 'Next'}
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return <ProgressWizard />;
  },
};

// ===== Reset Functionality =====

/**
 * Demonstrates the reset functionality.
 */
export const ResetFunctionality: Story = {
  render: () => {
    function ResetWizard() {
      const stepper = useStepper({
        steps: basicSteps,
        onComplete: () => {
          // Don't alert, just stay completed
        },
      });

      return (
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Reset Functionality</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stepper.isCompleted ? (
              <div className="text-center space-y-4">
                <p className="text-success font-medium">Wizard Completed!</p>
                <Button onClick={stepper.reset}>Start Over</Button>
              </div>
            ) : (
              <>
                <p className="font-medium">{stepper.currentStep.title}</p>
                <p className="text-sm text-muted-foreground">
                  Progress: {stepper.progress}%
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={stepper.prev} disabled={stepper.isFirst}>
                    Back
                  </Button>
                  <Button onClick={() => stepper.next()}>
                    {stepper.isLast ? 'Complete' : 'Next'}
                  </Button>
                  <Button variant="destructive" onClick={stepper.reset}>
                    Reset
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      );
    }

    return <ResetWizard />;
  },
};

// ===== Hook API Reference =====

/**
 * Visual API reference showing all return values from the hook.
 */
export const APIReference: Story = {
  render: () => {
    function APIDemo() {
      const stepper = useStepper({
        steps: basicSteps,
        onComplete: () => {},
      });

      return (
        <Card className="w-[600px]">
          <CardHeader>
            <CardTitle>useStepper Return Values</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm font-mono">
              <div className="space-y-1">
                <p className="text-muted-foreground">Navigation State</p>
                <p>currentIndex: <span className="text-primary">{stepper.currentIndex}</span></p>
                <p>currentStep.id: <span className="text-primary">{stepper.currentStep.id}</span></p>
                <p>isFirst: <span className="text-primary">{String(stepper.isFirst)}</span></p>
                <p>isLast: <span className="text-primary">{String(stepper.isLast)}</span></p>
                <p>canProceed: <span className="text-primary">{String(stepper.canProceed)}</span></p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Progress</p>
                <p>progress: <span className="text-primary">{stepper.progress}%</span></p>
                <p>completedCount: <span className="text-primary">{stepper.completedCount}</span></p>
                <p>totalSteps: <span className="text-primary">{stepper.totalSteps}</span></p>
                <p>isCompleted: <span className="text-primary">{String(stepper.isCompleted)}</span></p>
                <p>isValidating: <span className="text-primary">{String(stepper.isValidating)}</span></p>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button size="sm" onClick={stepper.prev} disabled={stepper.isFirst}>
                prev()
              </Button>
              <Button size="sm" onClick={() => stepper.next()}>
                next()
              </Button>
              <Button size="sm" variant="outline" onClick={stepper.reset}>
                reset()
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return <APIDemo />;
  },
};

// ===== Interactive Test =====

/**
 * Interactive test story with play function for automated testing.
 */
export const InteractiveTest: Story = {
  render: () => {
    function TestWizard() {
      const stepper = useStepper({
        steps: basicSteps,
        onComplete: () => {},
      });

      return (
        <div className="space-y-4" data-testid="wizard">
          <p data-testid="current-step">{stepper.currentStep.title}</p>
          <p data-testid="step-index">{stepper.currentIndex}</p>
          <p data-testid="progress">{stepper.progress}%</p>
          <div className="flex gap-2">
            <Button
              data-testid="back-btn"
              onClick={stepper.prev}
              disabled={stepper.isFirst}
            >
              Back
            </Button>
            <Button data-testid="next-btn" onClick={() => stepper.next()}>
              {stepper.isLast ? 'Complete' : 'Next'}
            </Button>
          </div>
        </div>
      );
    }

    return <TestWizard />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Initial state - Step 1', async () => {
      const stepText = canvas.getByTestId('current-step');
      await expect(stepText).toHaveTextContent('WAN Configuration');

      const index = canvas.getByTestId('step-index');
      await expect(index).toHaveTextContent('0');

      const progress = canvas.getByTestId('progress');
      await expect(progress).toHaveTextContent('0%');
    });

    await step('Click Next - Advance to Step 2', async () => {
      const nextBtn = canvas.getByTestId('next-btn');
      await userEvent.click(nextBtn);

      await waitFor(() => {
        const stepText = canvas.getByTestId('current-step');
        expect(stepText).toHaveTextContent('LAN Setup');
      });

      const progress = canvas.getByTestId('progress');
      await expect(progress).toHaveTextContent('33%');
    });

    await step('Click Back - Return to Step 1', async () => {
      const backBtn = canvas.getByTestId('back-btn');
      await userEvent.click(backBtn);

      await waitFor(() => {
        const stepText = canvas.getByTestId('current-step');
        expect(stepText).toHaveTextContent('WAN Configuration');
      });
    });

    await step('Navigate through all steps', async () => {
      const nextBtn = canvas.getByTestId('next-btn');

      // Go to step 2
      await userEvent.click(nextBtn);
      await waitFor(() => {
        expect(canvas.getByTestId('current-step')).toHaveTextContent('LAN Setup');
      });

      // Go to step 3
      await userEvent.click(nextBtn);
      await waitFor(() => {
        expect(canvas.getByTestId('current-step')).toHaveTextContent('Review');
      });

      // Button should say "Complete" on last step
      await expect(nextBtn).toHaveTextContent('Complete');
    });
  },
};

// ===== Dark Theme =====

/**
 * Dark theme demo.
 */
export const DarkTheme: Story = {
  render: () => {
    function DarkWizard() {
      const stepper = useStepper({
        steps: basicSteps,
        onComplete: () => {},
      });

      return (
        <div className="dark bg-background p-4 rounded-lg">
          <Card className="w-[400px]">
            <CardHeader>
              <CardTitle>{stepper.currentStep.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${stepper.progress}%` }}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={stepper.prev} disabled={stepper.isFirst}>
                  Back
                </Button>
                <Button onClick={() => stepper.next()}>
                  {stepper.isLast ? 'Complete' : 'Next'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return <DarkWizard />;
  },
  globals: {
    backgrounds: {
      value: "dark"
    }
  },
};
