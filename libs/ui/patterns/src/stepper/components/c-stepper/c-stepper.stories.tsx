/**
 * CStepper Storybook Stories
 *
 * Interactive stories for the Content Stepper (Desktop with Preview) component.
 *
 * @see NAS-4A.17: Build Content Stepper (Desktop with Preview)
 */

import * as React from 'react';

import { within, userEvent, expect, waitFor } from '@storybook/test';

import { Card, CardContent, CardHeader, CardTitle, Input, Label } from '@nasnet/ui/primitives';

import { CStepper } from './c-stepper';
import { useStepper } from '../../hooks/use-stepper';

import type { StepConfig, StepperConfig } from '../../hooks/use-stepper.types';
import type { Meta, StoryObj } from '@storybook/react';

// ===== Meta =====

const meta: Meta<typeof CStepper> = {
  title: 'Patterns/Stepper/CStepper',
  component: CStepper,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Content Stepper (Desktop with Preview)

Three-column desktop wizard layout with vertical sidebar, content area, and collapsible preview panel.

## Layout

- **Left (280px):** Vertical stepper sidebar showing all steps
- **Center (flexible):** Step content area with forms
- **Right (320px):** Collapsible live preview panel

## Usage

\`\`\`tsx
import { CStepper, useStepper } from '@nasnet/ui/patterns';

const stepper = useStepper({
  steps: [
    { id: 'wan', title: 'WAN Configuration', validate: validateWan },
    { id: 'lan', title: 'LAN Setup', validate: validateLan },
    { id: 'review', title: 'Review' },
  ],
  onComplete: handleComplete,
});

return (
  <CStepper
    stepper={stepper}
    stepContent={<StepContent step={stepper.currentStep.id} />}
    previewContent={
      <div className="space-y-4">
        <ConfigPreview script={previewScript} />
        <NetworkTopologySVG config={networkConfig} />
      </div>
    }
  />
);
\`\`\`

## Features

- ✅ Three-column layout (sidebar, content, preview)
- ✅ Preview panel auto-collapses below 1280px
- ✅ Keyboard shortcuts (Alt+P, Alt+N, Alt+B)
- ✅ WCAG AAA accessible
- ✅ RTL layout support
- ✅ Reduced motion support
- ✅ Dark/light theme support
        `,
      },
    },
  },
  argTypes: {
    previewTitle: {
      control: 'text',
      description: 'Title for the preview panel',
      defaultValue: 'Preview',
    },
    defaultShowPreview: {
      control: 'boolean',
      description: 'Show preview panel by default',
      defaultValue: true,
    },
    sidebarWidth: {
      control: 'text',
      description: 'Width of the sidebar',
      defaultValue: '280px',
    },
    previewWidth: {
      control: 'text',
      description: 'Width of the preview panel',
      defaultValue: '320px',
    },
    showStepDescriptions: {
      control: 'boolean',
      description: 'Show step descriptions in sidebar',
      defaultValue: true,
    },
  },
};

export default meta;
type Story = StoryObj<typeof CStepper>;

// ===== Test Data =====

const wizardSteps: StepConfig[] = [
  {
    id: 'choose',
    title: 'Choose Setup Type',
    description: 'Select your configuration method',
    icon: 'settings',
  },
  {
    id: 'wan',
    title: 'WAN Configuration',
    description: 'Configure external network',
    icon: 'globe',
  },
  {
    id: 'lan',
    title: 'LAN Configuration',
    description: 'Configure internal network',
    icon: 'network',
  },
  {
    id: 'extra',
    title: 'Additional Settings',
    description: 'VPN, Firewall, QoS',
    icon: 'shield',
  },
  {
    id: 'preview',
    title: 'Review & Apply',
    description: 'Review and generate config',
    icon: 'check',
  },
];

// ===== Step Content Components =====

function ChooseStepContent() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Choose Setup Type</h2>
      <p className="text-muted-foreground">
        Select how you want to configure your router.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:border-primary">
          <CardHeader>
            <CardTitle className="text-lg">Quick Setup</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Simple wizard for basic home/office setup
            </p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary">
          <CardHeader>
            <CardTitle className="text-lg">Advanced Setup</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Full control over all configuration options
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function WANStepContent() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">WAN Configuration</h2>
      <p className="text-muted-foreground">
        Configure your internet connection settings.
      </p>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="wan-ip">WAN IP Address</Label>
          <Input id="wan-ip" placeholder="192.168.1.1" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gateway">Gateway</Label>
          <Input id="gateway" placeholder="192.168.1.254" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dns">DNS Server</Label>
          <Input id="dns" placeholder="8.8.8.8" />
        </div>
      </div>
    </div>
  );
}

function LANStepContent() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">LAN Configuration</h2>
      <p className="text-muted-foreground">
        Configure your internal network settings.
      </p>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="lan-ip">LAN IP Address</Label>
          <Input id="lan-ip" placeholder="10.0.0.1" defaultValue="10.0.0.1" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="subnet">Subnet Mask</Label>
          <Input id="subnet" placeholder="255.255.255.0" defaultValue="255.255.255.0" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dhcp-range">DHCP Range</Label>
          <Input id="dhcp-range" placeholder="10.0.0.100-10.0.0.200" defaultValue="10.0.0.100-10.0.0.200" />
        </div>
      </div>
    </div>
  );
}

function ExtraStepContent() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Additional Settings</h2>
      <p className="text-muted-foreground">
        Configure optional features for your network.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">VPN</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Enable WireGuard VPN</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Firewall</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Configure firewall rules</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ReviewStepContent() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Review & Apply</h2>
      <p className="text-muted-foreground">
        Review your configuration before applying.
      </p>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configuration Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">WAN IP:</span>
            <span>192.168.1.1</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">LAN IP:</span>
            <span>10.0.0.1/24</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">DHCP:</span>
            <span>10.0.0.100-200</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StepContent({ stepId }: { stepId: string }) {
  switch (stepId) {
    case 'choose':
      return <ChooseStepContent />;
    case 'wan':
      return <WANStepContent />;
    case 'lan':
      return <LANStepContent />;
    case 'extra':
      return <ExtraStepContent />;
    case 'preview':
      return <ReviewStepContent />;
    default:
      return <div>Step: {stepId}</div>;
  }
}

// ===== Preview Content Components =====

function ConfigPreviewContent() {
  const routerOSScript = `# RouterOS Configuration
# Generated by NasNetConnect

/ip address
add address=192.168.1.1/24 interface=ether1 comment="WAN"
add address=10.0.0.1/24 interface=bridge comment="LAN"

/ip pool
add name=dhcp-pool ranges=10.0.0.100-10.0.0.200

/ip dhcp-server
add name=dhcp1 interface=bridge address-pool=dhcp-pool

/ip dhcp-server network
add address=10.0.0.0/24 gateway=10.0.0.1 dns-server=8.8.8.8

/ip firewall nat
add chain=srcnat out-interface=ether1 action=masquerade`;

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold mb-2">RouterOS Script</h4>
        <pre className="bg-muted p-3 rounded-md text-xs font-mono overflow-x-auto whitespace-pre-wrap">
          {routerOSScript}
        </pre>
      </div>
      <div>
        <h4 className="text-sm font-semibold mb-2">Network Topology</h4>
        <div className="bg-muted p-4 rounded-md text-center text-muted-foreground">
          <svg className="w-full h-32" viewBox="0 0 200 100">
            <rect x="70" y="30" width="60" height="40" rx="4" fill="currentColor" opacity="0.2" />
            <text x="100" y="55" textAnchor="middle" className="text-xs fill-current">Router</text>
            <circle cx="30" cy="50" r="15" fill="currentColor" opacity="0.1" />
            <text x="30" y="55" textAnchor="middle" className="text-[8px] fill-current">WAN</text>
            <circle cx="170" cy="50" r="15" fill="currentColor" opacity="0.1" />
            <text x="170" y="55" textAnchor="middle" className="text-[8px] fill-current">LAN</text>
            <line x1="45" y1="50" x2="70" y2="50" stroke="currentColor" strokeWidth="2" opacity="0.5" />
            <line x1="130" y1="50" x2="155" y2="50" stroke="currentColor" strokeWidth="2" opacity="0.5" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ===== Story Wrapper =====

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

// ===== Stories =====

/**
 * Default story - Full three-column layout
 */
export const Default: Story = {
  render: (args) => (
    <StepperWrapper steps={wizardSteps}>
      {(stepper) => (
        <div className="h-screen">
          <CStepper
            {...args}
            stepper={stepper}
            stepContent={<StepContent stepId={stepper.currentStep.id} />}
            previewContent={<ConfigPreviewContent />}
          />
        </div>
      )}
    </StepperWrapper>
  ),
  args: {
    previewTitle: 'Configuration Preview',
    defaultShowPreview: true,
    showStepDescriptions: true,
  },
};

/**
 * With preview collapsed
 */
export const PreviewCollapsed: Story = {
  render: (args) => (
    <StepperWrapper steps={wizardSteps}>
      {(stepper) => (
        <div className="h-screen">
          <CStepper
            {...args}
            stepper={stepper}
            stepContent={<StepContent stepId={stepper.currentStep.id} />}
            previewContent={<ConfigPreviewContent />}
          />
        </div>
      )}
    </StepperWrapper>
  ),
  args: {
    previewTitle: 'Preview',
    defaultShowPreview: false,
    showStepDescriptions: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Preview panel starts collapsed. Click the floating "Preview" button to show it.',
      },
    },
  },
};

/**
 * Without preview content
 */
export const NoPreview: Story = {
  render: (args) => (
    <StepperWrapper steps={wizardSteps}>
      {(stepper) => (
        <div className="h-screen">
          <CStepper
            {...args}
            stepper={stepper}
            stepContent={<StepContent stepId={stepper.currentStep.id} />}
          />
        </div>
      )}
    </StepperWrapper>
  ),
  args: {
    showStepDescriptions: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Two-column layout without preview panel. No toggle button appears.',
      },
    },
  },
};

/**
 * Custom widths
 */
export const CustomWidths: Story = {
  render: (args) => (
    <StepperWrapper steps={wizardSteps}>
      {(stepper) => (
        <div className="h-screen">
          <CStepper
            {...args}
            stepper={stepper}
            stepContent={<StepContent stepId={stepper.currentStep.id} />}
            previewContent={<ConfigPreviewContent />}
            sidebarWidth={320}
            previewWidth={400}
          />
        </div>
      )}
    </StepperWrapper>
  ),
  args: {
    previewTitle: 'Wide Preview',
    defaultShowPreview: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom sidebar (320px) and preview (400px) widths.',
      },
    },
  },
};

/**
 * With validation errors
 */
export const WithErrors: Story = {
  render: (args) => {
    function ErrorStepper() {
      const stepper = useStepper({
        steps: [
          {
            id: 'wan',
            title: 'WAN Configuration',
            description: 'Configure external network',
            validate: async () => ({
              valid: false,
              errors: {
                'wan-ip': 'Invalid IP address format',
                gateway: 'Gateway is required',
              },
            }),
          },
          { id: 'lan', title: 'LAN Setup', description: 'Configure internal network' },
          { id: 'review', title: 'Review', description: 'Confirm settings' },
        ],
      });

      // Trigger validation error on mount
      React.useEffect(() => {
        stepper.next();
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      return (
        <div className="h-screen">
          <CStepper
            {...args}
            stepper={stepper}
            stepContent={
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">WAN Configuration</h2>
                {Object.keys(stepper.errors).length > 0 && (
                  <div className="p-4 bg-error/10 border border-error/20 rounded-md">
                    <h3 className="text-sm font-semibold text-error mb-2">Validation Errors</h3>
                    <ul className="space-y-1 text-sm text-error">
                      {Object.entries(stepper.errors).map(([field, error]) => (
                        <li key={field}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <WANStepContent />
              </div>
            }
            previewContent={<ConfigPreviewContent />}
          />
        </div>
      );
    }

    return <ErrorStepper />;
  },
  args: {
    previewTitle: 'Preview',
    defaultShowPreview: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows validation errors in the step content and sidebar.',
      },
    },
  },
};

/**
 * Dark theme
 */
export const DarkTheme: Story = {
  render: (args) => (
    <div className="dark">
      <StepperWrapper steps={wizardSteps}>
        {(stepper) => (
          <div className="h-screen bg-background">
            <CStepper
              {...args}
              stepper={stepper}
              stepContent={<StepContent stepId={stepper.currentStep.id} />}
              previewContent={<ConfigPreviewContent />}
            />
          </div>
        )}
      </StepperWrapper>
    </div>
  ),
  args: {
    previewTitle: 'Preview',
    defaultShowPreview: true,
  },
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'CStepper in dark theme using semantic color tokens.',
      },
    },
  },
};

/**
 * Custom navigation labels
 */
export const CustomNavigationLabels: Story = {
  render: (args) => (
    <StepperWrapper steps={wizardSteps}>
      {(stepper) => (
        <div className="h-screen">
          <CStepper
            {...args}
            stepper={stepper}
            stepContent={<StepContent stepId={stepper.currentStep.id} />}
            previewContent={<ConfigPreviewContent />}
            navigationLabels={{
              previous: 'Go Back',
              next: 'Continue',
              complete: 'Apply Configuration',
            }}
          />
        </div>
      )}
    </StepperWrapper>
  ),
  args: {
    previewTitle: 'Preview',
    defaultShowPreview: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom labels for navigation buttons.',
      },
    },
  },
};

/**
 * Interactive story with keyboard shortcuts
 */
export const Interactive: Story = {
  render: (args) => (
    <StepperWrapper steps={wizardSteps}>
      {(stepper) => (
        <div className="h-screen">
          <CStepper
            {...args}
            stepper={stepper}
            stepContent={
              <div className="space-y-4">
                <StepContent stepId={stepper.currentStep.id} />
                <div className="p-4 bg-muted rounded-md">
                  <h4 className="text-sm font-semibold mb-2">Keyboard Shortcuts</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li><kbd className="px-2 py-1 bg-background rounded">Alt+P</kbd> Toggle preview panel</li>
                    <li><kbd className="px-2 py-1 bg-background rounded">Alt+N</kbd> Next step</li>
                    <li><kbd className="px-2 py-1 bg-background rounded">Alt+B</kbd> Previous step</li>
                  </ul>
                </div>
              </div>
            }
            previewContent={<ConfigPreviewContent />}
            data-testid="c-stepper"
          />
        </div>
      )}
    </StepperWrapper>
  ),
  args: {
    previewTitle: 'Configuration Preview',
    defaultShowPreview: true,
    showStepDescriptions: true,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Initial state - Step 1 active with preview visible', async () => {
      const previewPanel = canvas.getByRole('complementary');
      await expect(previewPanel).toBeInTheDocument();
    });

    await step('Click Next to advance', async () => {
      const nextButton = canvas.getByRole('button', { name: /next/i });
      await userEvent.click(nextButton);

      await waitFor(() => {
        const heading = canvas.getByRole('heading', { name: /WAN Configuration/i });
        expect(heading).toBeInTheDocument();
      });
    });

    await step('Click preview close button', async () => {
      const closeButton = canvas.getByRole('button', { name: /close preview/i });
      await userEvent.click(closeButton);

      await waitFor(() => {
        const showButton = canvas.getByRole('button', { name: /show preview/i });
        expect(showButton).toBeInTheDocument();
      });
    });

    await step('Click floating button to show preview', async () => {
      const showButton = canvas.getByRole('button', { name: /show preview/i });
      await userEvent.click(showButton);

      await waitFor(() => {
        const previewPanel = canvas.getByRole('complementary');
        expect(previewPanel).toBeInTheDocument();
      });
    });
  },
};

/**
 * Responsive behavior (resize viewport to see auto-collapse)
 */
export const ResponsiveBehavior: Story = {
  render: (args) => (
    <StepperWrapper steps={wizardSteps}>
      {(stepper) => (
        <div className="h-screen">
          <CStepper
            {...args}
            stepper={stepper}
            stepContent={
              <div className="space-y-4">
                <StepContent stepId={stepper.currentStep.id} />
                <div className="p-4 bg-muted rounded-md">
                  <h4 className="text-sm font-semibold mb-2">Responsive Behavior</h4>
                  <p className="text-sm text-muted-foreground">
                    Resize the viewport below 1280px to see the preview panel auto-collapse.
                  </p>
                </div>
              </div>
            }
            previewContent={<ConfigPreviewContent />}
          />
        </div>
      )}
    </StepperWrapper>
  ),
  args: {
    previewTitle: 'Preview',
    defaultShowPreview: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story: 'Preview panel auto-collapses when viewport width is below 1280px.',
      },
    },
  },
};
