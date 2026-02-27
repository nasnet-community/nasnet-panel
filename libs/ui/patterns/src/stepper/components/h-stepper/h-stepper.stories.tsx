/**
 * HStepper Storybook Stories
 *
 * Interactive stories for the Horizontal Stepper (Header Pattern) component.
 *
 * @see NAS-4A.16: Build Horizontal Stepper (Header Pattern)
 */

import { within, userEvent, expect, waitFor } from 'storybook/test';

import { Button } from '@nasnet/ui/primitives';

import { HStepper } from './h-stepper';
import { useStepper } from '../../hooks/use-stepper';

import type { StepConfig, StepperConfig } from '../../hooks/use-stepper.types';
import type { Meta, StoryObj } from '@storybook/react';

// ===== Meta =====

const meta: Meta<typeof HStepper> = {
  title: 'Patterns/Stepper/HStepper',
  component: HStepper,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Horizontal Stepper (Header Pattern)

Tablet-optimized horizontal stepper for header navigation. Shows step progress horizontally with a gradient progress line.

## Usage

\`\`\`tsx
import { HStepper, useStepper } from '@nasnet/ui/patterns';

const stepper = useStepper({
  steps: [
    { id: 'wan', title: 'WAN Configuration' },
    { id: 'lan', title: 'LAN Setup' },
    { id: 'review', title: 'Review' },
  ],
  onComplete: (data) => console.log('Complete!', data),
});

return (
  <div>
    <HStepper stepper={stepper} />
    <main className="pt-4">
      <StepContent />
    </main>
  </div>
);
\`\`\`

## Features

- ✅ Horizontal layout optimized for tablet headers
- ✅ Sticky header with backdrop blur
- ✅ Gradient progress line (primary → secondary)
- ✅ Step indicators with completion checkmarks
- ✅ Error state with destructive styling
- ✅ Click navigation to completed steps
- ✅ Responsive: titles hidden on mobile (<768px)
- ✅ WCAG AAA accessible (keyboard nav, screen reader)
- ✅ 44px minimum touch targets
- ✅ CSS transitions (no Framer Motion dependency)
- ✅ Reduced motion support
        `,
      },
    },
  },
  argTypes: {
    sticky: {
      control: 'boolean',
      description: 'Sticky header position',
      defaultValue: true,
    },
    stickyOffset: {
      control: 'text',
      description: 'Top offset for sticky positioning',
      defaultValue: '0',
    },
    showTitles: {
      control: 'boolean',
      description: 'Show step titles below indicators (hidden on mobile)',
      defaultValue: true,
    },
    showBackButton: {
      control: 'boolean',
      description: 'Show back button when not on first step',
      defaultValue: true,
    },
    allowSkipSteps: {
      control: 'boolean',
      description: 'Allow clicking future steps to skip ahead',
      defaultValue: false,
    },
    'aria-label': {
      control: 'text',
      description: 'ARIA label for screen readers',
      defaultValue: 'Wizard progress',
    },
  },
};

export default meta;
type Story = StoryObj<typeof HStepper>;

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

const threeSteps: StepConfig[] = [
  { id: 'wan', title: 'WAN Configuration' },
  { id: 'lan', title: 'LAN Setup' },
  { id: 'review', title: 'Review' },
];

// ===== Stories =====

/**
 * Default story - 5 steps horizontal header
 */
export const Default: Story = {
  render: ({ stepper: _unusedStepper, ...args }) => (
    <StepperWrapper steps={basicSteps}>
      {(stepper) => (
        <div className="bg-muted/30 min-h-screen">
          <HStepper
            {...args}
            stepper={stepper}
          />
          <main className="container mx-auto p-6">
            <div className="bg-background rounded-lg p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">{stepper.currentStep.title}</h2>
              <p className="text-muted-foreground mb-6">{stepper.currentStep.description}</p>
              <div className="flex gap-2">
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
          </main>
        </div>
      )}
    </StepperWrapper>
  ),
  args: {
    sticky: true,
    showTitles: true,
    showBackButton: true,
    allowSkipSteps: false,
    'aria-label': 'Wizard progress',
  },
};

/**
 * Progress at various stages
 */
export const ProgressStages: Story = {
  render: (_args) => {
    function ProgressDemo() {
      const [stage, setStage] = React.useState(0);
      const stepper = useStepper({
        steps: basicSteps,
        initialStep: stage,
      });

      // Sync stage with buttons
      React.useEffect(() => {
        const advanceToStage = async () => {
          stepper.reset();
          for (let i = 0; i < stage; i++) {
            await stepper.next();
          }
        };
        advanceToStage();
      }, [stage, stepper]);

      return (
        <div className="bg-muted/30 min-h-screen">
          <HStepper
            stepper={stepper}
            showTitles
          />
          <main className="container mx-auto p-6">
            <div className="bg-background rounded-lg p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">Progress Demo</h2>
              <p className="text-muted-foreground mb-6">
                Click to jump to different progress stages:
              </p>
              <div className="flex flex-wrap gap-2">
                {[0, 1, 2, 3, 4].map((s) => (
                  <Button
                    key={s}
                    variant={stage === s ? 'default' : 'outline'}
                    onClick={() => setStage(s)}
                  >
                    Step {s + 1}
                  </Button>
                ))}
              </div>
              <p className="text-muted-foreground mt-4 text-sm">Progress: {stepper.progress}%</p>
            </div>
          </main>
        </div>
      );
    }

    return <ProgressDemo />;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows progress bar filling at different stages. Progress is calculated as (activeStep / (totalSteps - 1)) * 100%.',
      },
    },
  },
};

/**
 * With completed steps
 */
export const WithCompletedSteps: Story = {
  render: (_args) => {
    function PreAdvancedStepper() {
      const stepper = useStepper({
        steps: basicSteps,
        initialStep: 0,
      });

      // Advance to step 3 on mount
      React.useEffect(() => {
        const advanceSteps = async () => {
          await stepper.next(); // Complete step 0, go to 1
          await stepper.next(); // Complete step 1, go to 2
          await stepper.next(); // Complete step 2, go to 3
        };
        advanceSteps();
      }, [stepper]);

      return (
        <div className="bg-muted/30 min-h-screen">
          <HStepper
            stepper={stepper}
            showTitles
          />
          <main className="container mx-auto p-6">
            <div className="bg-background rounded-lg p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">{stepper.currentStep.title}</h2>
              <p className="text-muted-foreground mb-2">{stepper.currentStep.description}</p>
              <p className="text-muted-foreground mb-6 text-sm">
                Progress: {stepper.progress}% ({stepper.completedCount}/{stepper.totalSteps} steps)
              </p>
              <p className="mb-4 text-sm">
                ✓ First 3 steps are completed. Click them to navigate back.
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
                  {stepper.isLast ? 'Complete' : 'Next'}
                </Button>
              </div>
            </div>
          </main>
        </div>
      );
    }

    return <PreAdvancedStepper />;
  },
};

/**
 * With error state
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
              },
            }),
          },
          { id: 'lan', title: 'LAN Setup', description: 'Configure internal network' },
          { id: 'security', title: 'Security', description: 'Firewall settings' },
          { id: 'review', title: 'Review', description: 'Confirm settings' },
        ],
      });

      // Trigger validation error on mount
      React.useEffect(() => {
        stepper.next();
      }, [stepper]);

      return (
        <div className="bg-muted/30 min-h-screen">
          <HStepper
            stepper={stepper}
            showTitles
          />
          <main className="container mx-auto p-6">
            <div className="bg-background border-destructive/20 rounded-lg border p-6 shadow-sm">
              <h2 className="text-destructive mb-4 text-xl font-semibold">Validation Errors</h2>
              <ul className="mb-6 space-y-1 text-sm">
                {Object.entries(stepper.errors).map(([field, error]) => (
                  <li
                    key={field}
                    className="text-destructive"
                  >
                    <strong>{field}:</strong> {error}
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => stepper.clearErrors()}
                >
                  Clear Errors
                </Button>
                <Button onClick={() => stepper.next()}>Try Again</Button>
              </div>
            </div>
          </main>
        </div>
      );
    }

    return <ErrorStateStepper />;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Error state showing destructive styling on step indicator. The progress bar stops at the error step.',
      },
    },
  },
};

/**
 * Responsive behavior - test at different viewport sizes
 */
export const Responsive: Story = {
  render: (_args) => (
    <StepperWrapper
      steps={basicSteps}
      initialStep={2}
    >
      {(stepper) => (
        <div className="bg-muted/30 min-h-screen">
          <HStepper
            stepper={stepper}
            showTitles
          />
          <main className="container mx-auto p-6">
            <div className="bg-background rounded-lg p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">Responsive Behavior</h2>
              <div className="space-y-4 text-sm">
                <p>
                  <strong>Desktop (≥768px):</strong> Step titles visible below indicators
                </p>
                <p>
                  <strong>Mobile (&lt;768px):</strong> Step titles hidden, only dots shown
                </p>
                <p>
                  <strong>All sizes:</strong> Progress bar and step label ("Step X of Y") always
                  visible
                </p>
                <p className="text-muted-foreground">
                  Resize your browser window to see the responsive behavior.
                </p>
              </div>
            </div>
          </main>
        </div>
      )}
    </StepperWrapper>
  ),

  parameters: {
    docs: {
      description: {
        story:
          'Use the viewport addon to test at different screen sizes. Step titles collapse on mobile.',
      },
    },
  },

  globals: {
    viewport: {
      value: 'responsive',
      isRotated: false,
    },
  },
};

/**
 * Interactive story with working navigation
 */
export const Interactive: Story = {
  render: ({ stepper: _unusedStepper, ...args }) => (
    <StepperWrapper steps={basicSteps}>
      {(stepper) => (
        <div className="bg-muted/30 min-h-screen">
          <HStepper
            {...args}
            stepper={stepper}
            data-testid="stepper"
          />
          <main className="container mx-auto p-6">
            <div className="bg-background rounded-lg p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">{stepper.currentStep.title}</h2>
              <p className="text-muted-foreground mb-4">{stepper.currentStep.description}</p>
              <p className="mb-6 text-sm">
                Step {stepper.currentIndex + 1} of {stepper.totalSteps} • Progress:{' '}
                {stepper.progress}%
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
                <Button
                  onClick={() => stepper.next()}
                  data-testid="next-button"
                >
                  {stepper.isLast ? 'Complete' : 'Next'}
                </Button>
              </div>
            </div>
          </main>
        </div>
      )}
    </StepperWrapper>
  ),
  args: {
    showTitles: true,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Initial state - Step 1 active', async () => {
      await expect(canvas.getByText(/Step 1 of 5: Choose Router/)).toBeInTheDocument();
    });

    await step('Click Next to advance', async () => {
      const nextButton = canvas.getByTestId('next-button');
      await userEvent.click(nextButton);

      await waitFor(() => {
        expect(canvas.getByText(/Step 2 of 5: WAN Configuration/)).toBeInTheDocument();
      });
    });

    await step('Back button appears and works', async () => {
      const backButton = canvas.getByLabelText('Go to previous step');
      await userEvent.click(backButton);

      await waitFor(() => {
        expect(canvas.getByText(/Step 1 of 5: Choose Router/)).toBeInTheDocument();
      });
    });

    await step('Advance multiple steps', async () => {
      const nextButton = canvas.getByTestId('next-button');
      await userEvent.click(nextButton);
      await userEvent.click(nextButton);
      await userEvent.click(nextButton);

      await waitFor(() => {
        expect(canvas.getByText(/Step 4 of 5: Extra Features/)).toBeInTheDocument();
      });
    });

    await step('Click completed step indicator to navigate back', async () => {
      // Find step 1 indicator by its aria-label
      const step1Button = canvas.getByRole('button', { name: /Step 1.*Choose Router/i });
      await userEvent.click(step1Button);

      await waitFor(() => {
        expect(canvas.getByText(/Step 1 of 5: Choose Router/)).toBeInTheDocument();
      });
    });
  },
};

/**
 * Dark theme
 */
export const DarkTheme: Story = {
  render: ({ stepper: _unusedStepper, ...args }) => (
    <div className="bg-background dark min-h-screen">
      <StepperWrapper
        steps={basicSteps}
        initialStep={2}
      >
        {(stepper) => (
          <>
            <HStepper
              {...args}
              stepper={stepper}
            />
            <main className="container mx-auto p-6">
              <div className="rounded-lg border p-6">
                <h2 className="mb-4 text-xl font-semibold">{stepper.currentStep.title}</h2>
                <p className="text-muted-foreground">Dark theme using semantic color tokens.</p>
                <div className="mt-6 flex gap-2">
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
            </main>
          </>
        )}
      </StepperWrapper>
    </div>
  ),

  args: {
    showTitles: true,
  },

  parameters: {
    docs: {
      description: {
        story: 'HStepper in dark theme. All colors adapt via CSS variables.',
      },
    },
  },

  globals: {
    backgrounds: {
      value: 'dark',
    },
  },
};

/**
 * With menu button
 */
export const WithMenuButton: Story = {
  render: (_args) => {
    const [menuOpen, setMenuOpen] = React.useState(false);

    return (
      <StepperWrapper steps={basicSteps}>
        {(stepper) => (
          <div className="bg-muted/30 min-h-screen">
            <HStepper
              stepper={stepper}
              showTitles
              onMenuClick={() => setMenuOpen(true)}
            />
            <main className="container mx-auto p-6">
              <div className="bg-background rounded-lg p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-semibold">{stepper.currentStep.title}</h2>
                {menuOpen && (
                  <div className="bg-muted mb-4 rounded-lg p-4">
                    <p className="mb-2 font-medium">Step Menu</p>
                    <ul className="space-y-1 text-sm">
                      {stepper.steps.map((step, index) => (
                        <li key={step.id}>
                          {index + 1}. {step.title}
                          {index === stepper.currentIndex && ' ← Current'}
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMenuOpen(false)}
                      className="mt-2"
                    >
                      Close Menu
                    </Button>
                  </div>
                )}
                <p className="text-muted-foreground">
                  Click the menu icon (≡) in the header to see the step list.
                </p>
              </div>
            </main>
          </div>
        )}
      </StepperWrapper>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Optional menu button for accessing step list or navigation options.',
      },
    },
  },
};

/**
 * Non-sticky header
 */
export const NonSticky: Story = {
  render: (_args) => (
    <StepperWrapper steps={basicSteps}>
      {(stepper) => (
        <div className="bg-muted/30 min-h-[200vh]">
          <HStepper
            stepper={stepper}
            sticky={false}
            showTitles
          />
          <main className="container mx-auto p-6">
            <div className="bg-background rounded-lg p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">Non-Sticky Header</h2>
              <p className="text-muted-foreground mb-4">
                The header scrolls with the content. Scroll down to see.
              </p>
              <div className="bg-muted/20 flex h-[150vh] items-center justify-center rounded-lg">
                <p className="text-muted-foreground">Scroll content area</p>
              </div>
            </div>
          </main>
        </div>
      )}
    </StepperWrapper>
  ),
  args: {
    sticky: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Header without sticky positioning. Useful when sticky behavior is not desired.',
      },
    },
  },
};

/**
 * Allow skip steps - click any step
 */
export const AllowSkipSteps: Story = {
  render: (_args) => (
    <StepperWrapper steps={basicSteps}>
      {(stepper) => (
        <div className="bg-muted/30 min-h-screen">
          <HStepper
            stepper={stepper}
            showTitles
            allowSkipSteps
          />
          <main className="container mx-auto p-6">
            <div className="bg-background rounded-lg p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">{stepper.currentStep.title}</h2>
              <p className="text-muted-foreground mb-4">
                Click any step indicator to jump directly to that step. (allowSkipSteps=true)
              </p>
              <p className="text-muted-foreground text-sm">
                Current step: {stepper.currentIndex + 1}
              </p>
            </div>
          </main>
        </div>
      )}
    </StepperWrapper>
  ),
  args: {
    allowSkipSteps: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'When allowSkipSteps is true, users can click any step to jump directly to it.',
      },
    },
  },
};

/**
 * 3 steps - minimal wizard
 */
export const ThreeSteps: Story = {
  render: (_args) => (
    <StepperWrapper steps={threeSteps}>
      {(stepper) => (
        <div className="bg-muted/30 min-h-screen">
          <HStepper
            stepper={stepper}
            showTitles
          />
          <main className="container mx-auto p-6">
            <div className="bg-background rounded-lg p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">{stepper.currentStep.title}</h2>
              <p className="text-muted-foreground mb-4 text-sm">Simple 3-step wizard flow.</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => stepper.prev()}
                  disabled={stepper.isFirst}
                >
                  Back
                </Button>
                <Button onClick={() => stepper.next()}>
                  {stepper.isLast ? 'Finish' : 'Continue'}
                </Button>
              </div>
            </div>
          </main>
        </div>
      )}
    </StepperWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Minimal 3-step wizard. Works well for simple flows.',
      },
    },
  },
};
