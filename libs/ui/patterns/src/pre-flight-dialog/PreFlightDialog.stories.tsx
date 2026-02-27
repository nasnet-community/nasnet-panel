/**
 * PreFlightDialog Storybook Stories
 *
 * Comprehensive stories demonstrating all PreFlightDialog states and scenarios.
 */

import { useState } from 'react';

import { Button } from '@nasnet/ui/primitives';

import { PreFlightDialog } from './PreFlightDialog';

import type { InsufficientResourcesError } from './types';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof PreFlightDialog> = {
  title: 'Patterns/PreFlightDialog',
  component: PreFlightDialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
PreFlightDialog shows insufficient resources error with service selection for stopping.

**Features:**
- Auto-selects suggestions to cover deficit (with 10% buffer)
- Live sufficiency check (green when enough, gray when insufficient)
- Platform-adaptive: bottom sheet on mobile, modal on desktop
- Optional override to start anyway (dangerous action)
- WCAG AAA accessible

**Use Cases:**
- Pre-flight checks before starting resource-intensive services
- Resource budgeting and conflict resolution
- User-guided resource management
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Whether the dialog is open',
    },
    serviceName: {
      control: 'text',
      description: 'Name of the service attempting to start',
    },
    allowOverride: {
      control: 'boolean',
      description: 'Whether to show "Override and Start Anyway" button',
    },
    variant: {
      control: 'select',
      options: ['mobile', 'desktop', undefined],
      description: 'Force a specific platform variant',
    },
  },
};

export default meta;
type Story = StoryObj<typeof PreFlightDialog>;

/**
 * Helper component to manage dialog open state
 */
function DialogWrapper(props: Partial<React.ComponentProps<typeof PreFlightDialog>>) {
  const [open, setOpen] = useState(false);

  const defaultError: InsufficientResourcesError = {
    resourceType: 'memory',
    required: 256,
    available: 200,
    deficit: 56,
    suggestions: [
      { id: '1', name: 'Tor', memoryUsage: 64, status: 'running', selected: false },
      { id: '2', name: 'Xray', memoryUsage: 32, status: 'running', selected: false },
      { id: '3', name: 'Psiphon', memoryUsage: 16, status: 'running', selected: false },
    ],
  };

  return (
    <div className="p-4">
      <Button onClick={() => setOpen(true)}>Open Dialog</Button>
      <PreFlightDialog
        open={open}
        onOpenChange={setOpen}
        error={defaultError}
        serviceName="AdGuard Home"
        onConfirmWithStops={(ids) => {
          console.log('Stop services:', ids);
          setOpen(false);
        }}
        onOverrideAndStart={() => {
          console.log('Override and start!');
          setOpen(false);
        }}
        {...props}
      />
    </div>
  );
}

/**
 * Slightly Over Budget
 * One service (Tor) is auto-selected and sufficient
 */
export const SlightlyOver: Story = {
  render: () => <DialogWrapper allowOverride={false} />,
  parameters: {
    docs: {
      description: {
        story: 'Deficit: 56 MB. Tor (64 MB) is auto-selected and sufficient to cover the deficit.',
      },
    },
  },
};

/**
 * Way Over Budget
 * Multiple services need to be stopped
 */
export const WayOver: Story = {
  render: () => {
    const largeDeficitError: InsufficientResourcesError = {
      resourceType: 'memory',
      required: 512,
      available: 100,
      deficit: 412,
      suggestions: [
        { id: '1', name: 'Xray-core', memoryUsage: 128, status: 'running', selected: false },
        { id: '2', name: 'Tor', memoryUsage: 96, status: 'running', selected: false },
        { id: '3', name: 'sing-box', memoryUsage: 112, status: 'running', selected: false },
        {
          id: '4',
          name: 'AdGuard Home',
          memoryUsage: 80,
          status: 'running',
          selected: false,
        },
        { id: '5', name: 'MTProxy', memoryUsage: 48, status: 'running', selected: false },
      ],
    };

    return (
      <DialogWrapper
        error={largeDeficitError}
        serviceName="Psiphon"
        allowOverride={false}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Deficit: 412 MB. Multiple services are auto-selected to cover the large deficit.',
      },
    },
  },
};

/**
 * With Many Suggestions
 * Shows scrollable list of services
 */
export const ManySuggestions: Story = {
  render: () => {
    const manySuggestionsError: InsufficientResourcesError = {
      resourceType: 'memory',
      required: 256,
      available: 200,
      deficit: 56,
      suggestions: [
        { id: '1', name: 'Xray-core', memoryUsage: 128, status: 'running', selected: false },
        { id: '2', name: 'Tor', memoryUsage: 96, status: 'running', selected: false },
        { id: '3', name: 'sing-box', memoryUsage: 112, status: 'running', selected: false },
        {
          id: '4',
          name: 'AdGuard Home',
          memoryUsage: 80,
          status: 'running',
          selected: false,
        },
        { id: '5', name: 'MTProxy', memoryUsage: 48, status: 'running', selected: false },
        { id: '6', name: 'Psiphon', memoryUsage: 32, status: 'running', selected: false },
        { id: '7', name: 'Shadowsocks', memoryUsage: 24, status: 'running', selected: false },
        { id: '8', name: 'V2Ray', memoryUsage: 64, status: 'running', selected: false },
      ],
    };

    return (
      <DialogWrapper
        error={manySuggestionsError}
        serviceName="WireGuard"
        allowOverride={false}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows scrollable list when there are many service suggestions.',
      },
    },
  },
};

/**
 * With Override Option
 * Allows user to bypass resource check (dangerous)
 */
export const WithOverride: Story = {
  render: () => <DialogWrapper allowOverride={true} />,
  parameters: {
    docs: {
      description: {
        story:
          'Shows "Override and Start Anyway" button for power users who want to bypass resource checks.',
      },
    },
  },
};

/**
 * Mobile Variant
 * Forces mobile presentation (bottom sheet)
 */
export const MobileVariant: Story = {
  render: () => (
    <DialogWrapper
      variant="mobile"
      allowOverride={true}
    />
  ),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'Mobile presentation uses a bottom sheet with swipe-to-dismiss gesture and larger touch targets.',
      },
    },
  },
};

/**
 * Desktop Variant
 * Forces desktop presentation (center modal)
 */
export const DesktopVariant: Story = {
  render: () => (
    <DialogWrapper
      variant="desktop"
      allowOverride={true}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Desktop presentation uses a centered modal dialog with keyboard navigation support.',
      },
    },
  },
};

/**
 * Controlled Example
 * Shows programmatic control of dialog state
 */
export const Controlled: Story = {
  render: () => {
    const ControlledExample = () => {
      const [open, setOpen] = useState(false);
      const [result, setResult] = useState<string>('');

      const error: InsufficientResourcesError = {
        resourceType: 'memory',
        required: 256,
        available: 200,
        deficit: 56,
        suggestions: [
          { id: '1', name: 'Tor', memoryUsage: 64, status: 'running', selected: false },
          { id: '2', name: 'Xray', memoryUsage: 32, status: 'running', selected: false },
        ],
      };

      return (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={() => setOpen(true)}>Open Dialog</Button>
            <Button
              onClick={() => setResult('')}
              variant="outline"
            >
              Clear Result
            </Button>
          </div>

          {result && (
            <div className="rounded-md bg-gray-100 p-4 dark:bg-gray-800">
              <pre className="text-sm">{result}</pre>
            </div>
          )}

          <PreFlightDialog
            open={open}
            onOpenChange={setOpen}
            error={error}
            serviceName="AdGuard Home"
            onConfirmWithStops={(ids) => {
              setResult(`Stopped services: ${ids.join(', ')}\nStarted: AdGuard Home`);
              setOpen(false);
            }}
            onOverrideAndStart={() => {
              setResult('Override! Started AdGuard Home without stopping other services.');
              setOpen(false);
            }}
            allowOverride={true}
          />
        </div>
      );
    };

    return <ControlledExample />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Example showing controlled dialog state with result display.',
      },
    },
  },
};
