/**
 * VStepper Storybook Stories
 *
 * Interactive stories for the Vertical Stepper (Sidebar Pattern) component.
 *
 * @see NAS-4A.15: Build Vertical Stepper (Sidebar Pattern)
 */


import { within, userEvent, expect, waitFor } from 'storybook/test';

import { Button } from '@nasnet/ui/primitives';

import { VStepper } from './v-stepper';
import { useStepper } from '../../hooks/use-stepper';

import type { StepConfig, StepperConfig } from '../../hooks/use-stepper.types';
import type { Meta, StoryObj } from '@storybook/react';

// ===== Meta =====

const meta: Meta<typeof VStepper> = {
  title: 'Patterns/Stepper/VStepper',
  component: VStepper,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Vertical Stepper (Sidebar Pattern)

Desktop-optimized vertical stepper for sidebar navigation. Shows all steps listed vertically with progress indicators.

## Usage

\`\`\`tsx
import { VStepper, useStepper } from '@nasnet/ui/patterns';

const stepper = useStepper({
  steps: [
    { id: 'wan', title: 'WAN Configuration' },
    { id: 'lan', title: 'LAN Setup' },
    { id: 'review', title: 'Review' },
  ],
  onComplete: (data) => console.log('Complete!', data),
});

return <VStepper stepper={stepper} />;
\`\`\`

## Features

- ✅ Vertical layout optimized for desktop sidebars
- ✅ Step indicators with completion checkmarks
- ✅ Error state display with tooltips
- ✅ Connector lines showing progress
- ✅ Click navigation to completed steps
- ✅ WCAG AAA accessible (keyboard nav, screen reader support)
- ✅ Reduced motion support
- ✅ Smooth animations with Framer Motion
        `,
      },
    },
  },
  argTypes: {
    width: {
      control: 'text',
      description: 'Width of the stepper sidebar',
      defaultValue: '256px',
    },
    showDescriptions: {
      control: 'boolean',
      description: 'Show step descriptions below titles',
      defaultValue: true,
    },
    showErrorCount: {
      control: 'boolean',
      description: 'Show error count badges',
      defaultValue: false,
    },
    'aria-label': {
      control: 'text',
      description: 'ARIA label for screen readers',
      defaultValue: 'Wizard steps',
    },
  },
};

export default meta;
type Story = StoryObj<typeof VStepper>;

// ===== Story Wrapper =====

/**
 * Wrapper component for stories that provides stepper state
 */
function StepperWrapper({
  steps,
  config = {},
  initialStep = 0,
  children,
}: {
  steps: StepConfig[];
  config?: Partial<StepperConfig>;
  initialStep?: number;
  children: (stepper: ReturnType<typeof useStepper>) => React.ReactNode;
}) {
  const stepper = useStepper({
    steps,
    initialStep,
    ...config,
  });

  return <>{children(stepper)}</>;
}

// ===== Test Data =====

const basicSteps: StepConfig[] = [
  { id: 'router', title: 'Choose Router', description: 'Select your MikroTik router' },
  { id: 'wan', title: 'WAN Configuration', description: 'Configure external network' },
  { id: 'lan', title: 'LAN Setup', description: 'Configure internal network' },
  { id: 'features', title: 'Extra Features', description: 'VPN, Firewall, QoS' },
  { id: 'review', title: 'Preview & Apply', description: 'Review and generate config' },
];

const _stepsWithIcons: StepConfig[] = [
  { id: 'router', title: 'Choose Router', description: 'Select your router', icon: 'router' },
  { id: 'wan', title: 'WAN Configuration', description: 'Configure WAN', icon: 'globe' },
  { id: 'lan', title: 'LAN Setup', description: 'Configure LAN', icon: 'network' },
  { id: 'review', title: 'Review', description: 'Confirm settings', icon: 'check' },
];

// ===== Stories =====

/**
 * Default story - 5 steps, all future (starting state)
 */
export const Default: Story = {
  render: ({ stepper: _unusedStepper, ...args }) => (
    <StepperWrapper steps={basicSteps}>
      {(stepper) => (
        <div className="flex gap-8">
          <VStepper {...args} stepper={stepper} />
          <div className="flex-1 p-4 border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">
              {stepper.currentStep.title}
            </h2>
            <p className="text-muted-foreground">
              {stepper.currentStep.description}
            </p>
            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => stepper.prev()}
                disabled={stepper.isFirst}
              >
                Back
              </Button>
              <Button onClick={() => stepper.next()}>
                {stepper.isLast ? 'Complete' : 'Next'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </StepperWrapper>
  ),
  args: {
    width: '256px',
    showDescriptions: true,
    showErrorCount: false,
    'aria-label': 'Wizard steps',
  },
};

/**
 * With completed steps - 3 complete, 1 current, 1 future
 */
export const WithCompletedSteps: Story = {
  render: (_args) => {
    // Create a component with pre-advanced stepper
    function PreAdvancedStepper() {
      const stepper = useStepper({
        steps: basicSteps,
        initialStep: 0,
      });

      // Advance to step 3 on mount (simulating completed steps)
      React.useEffect(() => {
        const advanceSteps = async () => {
          await stepper.next(); // Complete step 0, go to 1
          await stepper.next(); // Complete step 1, go to 2
          await stepper.next(); // Complete step 2, go to 3
        };
        advanceSteps();
      }, [stepper]);

      return (
        <div className="flex gap-8">
          <VStepper stepper={stepper} showDescriptions />
          <div className="flex-1 p-4 border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">
              {stepper.currentStep.title}
            </h2>
            <p className="text-muted-foreground mb-2">
              {stepper.currentStep.description}
            </p>
            <p className="text-sm text-muted-foreground">
              Progress: {stepper.progress}% ({stepper.completedCount}/{stepper.totalSteps} steps)
            </p>
            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => stepper.prev()}
                disabled={stepper.isFirst}
              >
                Back
              </Button>
              <Button onClick={() => stepper.next()}>
                {stepper.isLast ? 'Complete' : 'Next'}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return <PreAdvancedStepper />;
  },
};

/**
 * Current step highlighted
 */
export const CurrentStepHighlighted: Story = {
  render: ({ stepper: _unusedStepper, ...args }) => (
    <StepperWrapper steps={basicSteps} initialStep={2}>
      {(stepper) => (
        <div className="flex gap-8">
          <VStepper {...args} stepper={stepper} />
          <div className="flex-1 p-4 border rounded-lg bg-primary/5">
            <h2 className="text-xl font-semibold mb-4 text-primary">
              Current: {stepper.currentStep.title}
            </h2>
            <p className="text-muted-foreground">
              Step {stepper.currentIndex + 1} of {stepper.totalSteps}
            </p>
          </div>
        </div>
      )}
    </StepperWrapper>
  ),
  args: {
    showDescriptions: true,
  },
};

/**
 * With error state and tooltip
 */
export const WithErrorState: Story = {
  render: (_args) => {
    function ErrorStateStepper() {
      const stepper = useStepper({
        steps: [
          {
            id: 'wan',
            title: 'WAN Configuration',
            description: 'Configure external network',
            validate: async () => ({
              valid: false,
              errors: {
                ip: 'Invalid IP address format',
                gateway: 'Gateway is required',
                dns: 'DNS server is unreachable',
              },
            }),
          },
          { id: 'lan', title: 'LAN Setup', description: 'Configure internal network' },
          { id: 'review', title: 'Review', description: 'Confirm settings' },
        ],
      });

      // Trigger validation error on mount
      React.useEffect(() => {
        stepper.next(); // This will fail validation and set errors
      }, [stepper]);

      return (
        <div className="flex gap-8">
          <VStepper stepper={stepper} showErrorCount showDescriptions />
          <div className="flex-1 p-4 border border-error/20 rounded-lg bg-error/5">
            <h2 className="text-xl font-semibold mb-4 text-error">
              Validation Errors
            </h2>
            <ul className="space-y-1 text-sm">
              {Object.entries(stepper.errors).map(([field, error]) => (
                <li key={field} className="text-error">
                  <strong>{field}:</strong> {error}
                </li>
              ))}
            </ul>
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={() => stepper.clearErrors()}>
                Clear Errors
              </Button>
              <Button onClick={() => stepper.next()}>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return <ErrorStateStepper />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Hover over the error step to see the tooltip with validation errors.',
      },
    },
  },
};

/**
 * Disabled/locked future steps
 */
export const DisabledFutureSteps: Story = {
  render: ({ stepper: _unusedStepper, ...args }) => (
    <StepperWrapper steps={basicSteps}>
      {(stepper) => (
        <div className="flex gap-8">
          <VStepper {...args} stepper={stepper} />
          <div className="flex-1 p-4 border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">
              {stepper.currentStep.title}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Future steps (3, 4, 5) are disabled and cannot be clicked.
              Complete each step to unlock the next one.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => stepper.prev()}
                disabled={stepper.isFirst}
              >
                Back
              </Button>
              <Button onClick={() => stepper.next()}>
                Complete Step
              </Button>
            </div>
          </div>
        </div>
      )}
    </StepperWrapper>
  ),
  args: {
    showDescriptions: true,
  },
};

/**
 * Without descriptions (compact mode)
 */
export const CompactMode: Story = {
  render: () => (
    <StepperWrapper steps={basicSteps}>
      {(stepper) => (
        <div className="flex gap-8">
          <VStepper stepper={stepper} showDescriptions={false} width="200px" />
          <div className="flex-1 p-4 border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">
              {stepper.currentStep.title}
            </h2>
            <p className="text-muted-foreground">
              {stepper.currentStep.description}
            </p>
          </div>
        </div>
      )}
    </StepperWrapper>
  ),
  args: {
    showDescriptions: false,
    width: '200px',
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact mode without descriptions, useful for narrow sidebars.',
      },
    },
  },
};

/**
 * Interactive story with play function
 */
export const Interactive: Story = {
  render: ({ stepper: _unusedStepper, ...args }) => (
    <StepperWrapper steps={basicSteps}>
      {(stepper) => (
        <div className="flex gap-8">
          <VStepper {...args} stepper={stepper} data-testid="stepper" />
          <div className="flex-1 p-4 border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">
              {stepper.currentStep.title}
            </h2>
            <p className="text-muted-foreground mb-4">
              {stepper.currentStep.description}
            </p>
            <p className="text-sm mb-6">
              Step {stepper.currentIndex + 1} of {stepper.totalSteps}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => stepper.prev()}
                disabled={stepper.isFirst}
                data-testid="back-button"
              >
                Back
              </Button>
              <Button onClick={() => stepper.next()} data-testid="next-button">
                {stepper.isLast ? 'Complete' : 'Next'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </StepperWrapper>
  ),
  args: {
    showDescriptions: true,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Initial state - Step 1 active', async () => {
      const step1 = canvas.getByRole('button', { name: /Choose Router/i });
      await expect(step1).toHaveAttribute('aria-current', 'step');
    });

    await step('Click Next to advance', async () => {
      const nextButton = canvas.getByTestId('next-button');
      await userEvent.click(nextButton);

      await waitFor(() => {
        const step2 = canvas.getByRole('button', { name: /WAN Configuration/i });
        expect(step2).toHaveAttribute('aria-current', 'step');
      });
    });

    await step('Navigate back to completed step by clicking', async () => {
      const step1 = canvas.getByRole('button', { name: /Choose Router/i });
      await userEvent.click(step1);

      await waitFor(() => {
        expect(step1).toHaveAttribute('aria-current', 'step');
      });
    });

    await step('Keyboard navigation - Tab to step', async () => {
      await userEvent.tab();
      const focusedElement = document.activeElement;
      await expect(focusedElement).toHaveAttribute('role', 'button');
    });

    await step('Keyboard navigation - Enter to activate', async () => {
      // First advance past step 1
      const nextButton = canvas.getByTestId('next-button');
      await userEvent.click(nextButton);

      await waitFor(() => {
        const step2 = canvas.getByRole('button', { name: /WAN Configuration/i });
        expect(step2).toHaveAttribute('aria-current', 'step');
      });

      // Tab to step 1 (completed)
      await userEvent.tab();

      // Press Enter
      await userEvent.keyboard('{Enter}');

      await waitFor(() => {
        const step1 = canvas.getByRole('button', { name: /Choose Router/i });
        expect(step1).toHaveAttribute('aria-current', 'step');
      });
    });
  },
};

/**
 * Dark theme
 */
export const DarkTheme: Story = {
  render: ({ stepper: _unusedStepper, ...args }) => (
    <div className="dark bg-background p-4 rounded-lg">
      <StepperWrapper steps={basicSteps}>
        {(stepper) => (
          <div className="flex gap-8">
            <VStepper {...args} stepper={stepper} />
            <div className="flex-1 p-4 border rounded-lg">
              <h2 className="text-xl font-semibold mb-4">
                {stepper.currentStep.title}
              </h2>
              <p className="text-muted-foreground">
                {stepper.currentStep.description}
              </p>
            </div>
          </div>
        )}
      </StepperWrapper>
    </div>
  ),

  args: {
    showDescriptions: true,
  },

  parameters: {
    docs: {
      description: {
        story: 'VStepper in dark theme using semantic color tokens.',
      },
    }
  },

  globals: {
    backgrounds: {
      value: "dark"
    }
  }
};

/**
 * With custom width
 */
export const CustomWidth: Story = {
  render: () => (
    <StepperWrapper steps={basicSteps}>
      {(stepper) => (
        <div className="flex gap-8">
          <VStepper stepper={stepper} width={320} showDescriptions />
          <div className="flex-1 p-4 border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">
              {stepper.currentStep.title}
            </h2>
            <p className="text-muted-foreground">
              Width set to 320px for wider sidebars.
            </p>
          </div>
        </div>
      )}
    </StepperWrapper>
  ),
};
