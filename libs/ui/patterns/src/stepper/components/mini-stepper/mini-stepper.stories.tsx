/**
 * MiniStepper Stories
 *
 * Storybook stories for the Mini Stepper mobile pattern.
 * Shows all variants and interaction states.
 *
 * @see NAS-4A.18: Build Mini Stepper (Mobile Pattern)
 */

import { MiniStepper } from './mini-stepper';
import { useStepper } from '../../hooks/use-stepper';

import type { StepConfig } from '../../hooks/use-stepper.types';
import type { Meta, StoryObj } from '@storybook/react';

// ===== Test Fixtures =====

const defaultSteps: StepConfig[] = [
  { id: 'setup', title: 'Choose Setup Mode', description: 'Select configuration type' },
  { id: 'wan', title: 'WAN Configuration', description: 'Configure your internet connection' },
  { id: 'lan', title: 'LAN Setup', description: 'Set up your local network' },
  { id: 'wifi', title: 'WiFi Settings', description: 'Configure wireless network' },
  { id: 'review', title: 'Review & Apply', description: 'Confirm your settings' },
];

const stepsWithValidation: StepConfig[] = [
  { id: 'step1', title: 'Basic Info' },
  {
    id: 'step2',
    title: 'Network Settings',
    validate: async () => {
      // Simulate async validation
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { valid: true };
    },
  },
  {
    id: 'step3',
    title: 'Security',
    validate: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return {
        valid: false,
        errors: { password: 'Password is too weak' },
      };
    },
  },
  { id: 'step4', title: 'Confirm' },
];

// ===== Story Wrapper Components =====

function DefaultMiniStepper() {
  const stepper = useStepper({
    steps: defaultSteps,
    onComplete: (data) => console.log('Wizard complete!', data),
  });

  return (
    <MiniStepper
      stepper={stepper}
      stepContent={<StepContent step={stepper.currentStep} />}
      onStepChange={(step, index) => console.log('Step changed:', step, index)}
    />
  );
}

function FirstStepMiniStepper() {
  const stepper = useStepper({
    steps: defaultSteps,
    initialStep: 0,
  });

  return (
    <MiniStepper
      stepper={stepper}
      stepContent={<StepContent step={stepper.currentStep} />}
    />
  );
}

function LastStepMiniStepper() {
  const stepper = useStepper({
    steps: defaultSteps,
    initialStep: 4,
  });

  return (
    <MiniStepper
      stepper={stepper}
      stepContent={<StepContent step={stepper.currentStep} />}
    />
  );
}

function WithValidationMiniStepper() {
  const stepper = useStepper({
    steps: stepsWithValidation,
    validateOnChange: true,
  });

  return (
    <MiniStepper
      stepper={stepper}
      stepContent={
        <div className="space-y-4">
          <StepContent step={stepper.currentStep} />
          {Object.keys(stepper.errors).length > 0 && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
              <strong>Validation Errors:</strong>
              <ul className="mt-1 list-inside list-disc">
                {Object.entries(stepper.errors).map(([field, error]) => (
                  <li key={field}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      }
    />
  );
}

function DisabledSwipeMiniStepper() {
  const stepper = useStepper({
    steps: defaultSteps,
    initialStep: 2,
  });

  return (
    <MiniStepper
      stepper={stepper}
      stepContent={
        <div className="space-y-4">
          <StepContent step={stepper.currentStep} />
          <p className="text-muted-foreground text-sm italic">
            Swipe navigation is disabled. Use buttons to navigate.
          </p>
        </div>
      }
      disableSwipe
    />
  );
}

function WithFormMiniStepper() {
  const stepper = useStepper({
    steps: defaultSteps,
    initialStep: 1,
  });

  return (
    <MiniStepper
      stepper={stepper}
      stepContent={<FormStepContent step={stepper.currentStep} />}
      disableSwipe // Disable swipe for form interaction
    />
  );
}

// ===== Content Components =====

function StepContent({ step }: { step: StepConfig }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{step.title}</h2>
      {step.description && <p className="text-muted-foreground">{step.description}</p>}
      <div className="bg-muted rounded-lg p-4">
        <p className="text-sm">
          This is placeholder content for the <strong>{step.title}</strong> step.
        </p>
        <p className="text-muted-foreground mt-2 text-sm">
          In a real application, this would contain form fields, configuration options, or
          informational content relevant to this step.
        </p>
      </div>
    </div>
  );
}

function FormStepContent({ step }: { step: StepConfig }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{step.title}</h2>
      <form className="space-y-4">
        <div>
          <label
            htmlFor="ip"
            className="mb-1 block text-sm font-medium"
          >
            IP Address
          </label>
          <input
            id="ip"
            type="text"
            placeholder="192.168.1.1"
            className="border-input bg-background w-full rounded-md border p-3"
          />
        </div>
        <div>
          <label
            htmlFor="subnet"
            className="mb-1 block text-sm font-medium"
          >
            Subnet Mask
          </label>
          <input
            id="subnet"
            type="text"
            placeholder="255.255.255.0"
            className="border-input bg-background w-full rounded-md border p-3"
          />
        </div>
        <div>
          <label
            htmlFor="gateway"
            className="mb-1 block text-sm font-medium"
          >
            Gateway
          </label>
          <input
            id="gateway"
            type="text"
            placeholder="192.168.1.1"
            className="border-input bg-background w-full rounded-md border p-3"
          />
        </div>
      </form>
    </div>
  );
}

// ===== Meta =====

const meta: Meta<typeof MiniStepper> = {
  title: 'Patterns/Stepper/MiniStepper',
  component: MiniStepper,
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        component: `
# Mini Stepper (Mobile Pattern)

A mobile-optimized stepper with swipe navigation for touch devices.

## Features

- **Compact Header**: Step indicator and progress bar in ≤64px
- **Swipe Navigation**: Horizontal swipe to navigate between steps
- **Touch-Friendly**: 44px minimum touch targets
- **Safe Area Support**: Respects iOS notch and home indicator
- **Reduced Motion**: Respects prefers-reduced-motion preference
- **Accessible**: Full ARIA support with live announcements

## Usage

\`\`\`tsx
import { useStepper, MiniStepper } from '@nasnet/ui/patterns';

const stepper = useStepper({
  steps: [
    { id: 'step1', title: 'Step 1' },
    { id: 'step2', title: 'Step 2' },
    { id: 'step3', title: 'Step 3' },
  ],
  onComplete: () => console.log('Done!'),
});

return (
  <MiniStepper
    stepper={stepper}
    stepContent={<YourStepContent />}
  />
);
\`\`\`
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-background h-screen">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MiniStepper>;

// ===== Stories =====

export const Default: Story = {
  render: () => <DefaultMiniStepper />,
  parameters: {
    docs: {
      description: {
        story: 'Default Mini Stepper with 5 steps. Try swiping left/right to navigate.',
      },
    },
  },
};

export const FirstStep: Story = {
  render: () => <FirstStepMiniStepper />,
  parameters: {
    docs: {
      description: {
        story: 'Mini Stepper on the first step. Back button is disabled.',
      },
    },
  },
};

export const LastStep: Story = {
  render: () => <LastStepMiniStepper />,
  parameters: {
    docs: {
      description: {
        story: 'Mini Stepper on the last step. "Next" button changes to "Finish".',
      },
    },
  },
};

export const WithValidation: Story = {
  render: () => <WithValidationMiniStepper />,
  parameters: {
    docs: {
      description: {
        story: `
Mini Stepper with async validation. Step 3 will fail validation and display errors.
Navigate to step 3 and try to proceed to see the validation error.
        `,
      },
    },
  },
};

export const DisabledSwipe: Story = {
  render: () => <DisabledSwipeMiniStepper />,
  parameters: {
    docs: {
      description: {
        story: 'Mini Stepper with swipe navigation disabled. Useful for forms with text inputs.',
      },
    },
  },
};

export const WithForm: Story = {
  render: () => <WithFormMiniStepper />,
  parameters: {
    docs: {
      description: {
        story:
          'Mini Stepper with form content. Swipe is disabled to prevent interference with form inputs.',
      },
    },
  },
};

export const ReducedMotion: Story = {
  render: () => <DefaultMiniStepper />,
  parameters: {
    docs: {
      description: {
        story:
          'Mini Stepper respects prefers-reduced-motion. Enable reduced motion in your OS to see the difference.',
      },
    },
    chromatic: {
      prefersReducedMotion: 'reduce',
    },
  },
};

export const DarkMode: Story = {
  render: () => <DefaultMiniStepper />,

  parameters: {
    docs: {
      description: {
        story: 'Mini Stepper in dark mode. Uses semantic color tokens for automatic theming.',
      },
    },
  },

  decorators: [
    (Story) => (
      <div className="bg-background dark h-screen">
        <Story />
      </div>
    ),
  ],

  globals: {
    backgrounds: {
      value: 'dark',
    },
  },
};
