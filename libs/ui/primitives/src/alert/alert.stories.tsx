import * as React from 'react';

import { AlertCircle, CheckCircle2, AlertTriangle, Info, Terminal, Zap, MessageSquare } from 'lucide-react';

import { Alert, AlertTitle, AlertDescription } from './alert';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Alert> = {
  title: 'Primitives/Alert',
  component: Alert,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Alert component for displaying messages, warnings, errors, and status updates. Uses semantic color tokens (success, warning, error, info) with proper contrast ratios. Supports role="alert" for automatic screen reader announcements. Available variants: default, success, warning, destructive (error), and info.',
      },
    },
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'success', 'warning', 'info'],
      description: 'Visual style variant: default, destructive (error), success, warning, info',
    },
    live: {
      control: 'boolean',
      description: 'If true, adds aria-live="polite" for dynamic announcements',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Default: Story = {
  render: () => (
    <Alert>
      <Terminal className="h-4 w-4" />
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        You can add components to your app using the cli.
      </AlertDescription>
    </Alert>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="grid gap-4">
      <Alert variant="default">
        <Info className="h-4 w-4" />
        <AlertTitle>Default Alert</AlertTitle>
        <AlertDescription>
          This is a default alert for general information.
        </AlertDescription>
      </Alert>

      <Alert variant="success">
        <CheckCircle2 className="h-4 w-4" />
        <AlertTitle>Success!</AlertTitle>
        <AlertDescription>
          Your configuration has been saved successfully.
        </AlertDescription>
      </Alert>

      <Alert variant="warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>
          Your session is about to expire. Please save your work.
        </AlertDescription>
      </Alert>

      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Connection failed. Please check your network settings.
        </AlertDescription>
      </Alert>

      <Alert variant="info">
        <Info className="h-4 w-4" />
        <AlertTitle>Did you know?</AlertTitle>
        <AlertDescription>
          You can use keyboard shortcuts to navigate faster.
        </AlertDescription>
      </Alert>
    </div>
  ),
};

export const ConnectionStatus: Story = {
  render: () => (
    <div className="grid gap-4">
      <Alert variant="success">
        <CheckCircle2 className="h-4 w-4" />
        <AlertTitle>VPN Connected</AlertTitle>
        <AlertDescription>
          You are now connected to the secure network. Your traffic is encrypted.
        </AlertDescription>
      </Alert>

      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Connection Lost</AlertTitle>
        <AlertDescription>
          Unable to reach the router. Please check your network connection.
        </AlertDescription>
      </Alert>
    </div>
  ),
};

export const Mobile: Story = {
  render: () => (
    <Alert variant="warning">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Storage Low</AlertTitle>
      <AlertDescription>
        Available storage is running low. Consider removing old logs.
      </AlertDescription>
    </Alert>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const Tablet: Story = {
  render: () => (
    <div className="space-y-3">
      <Alert variant="info">
        <Info className="h-5 w-5" />
        <AlertTitle>System Update Available</AlertTitle>
        <AlertDescription>
          A new firmware version is available. Update now to get the latest features and security fixes.
        </AlertDescription>
      </Alert>
    </div>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

export const Desktop: Story = {
  render: () => (
    <div className="max-w-2xl space-y-4">
      <Alert variant="destructive">
        <Zap className="h-5 w-5" />
        <AlertTitle>Critical Configuration Issue</AlertTitle>
        <AlertDescription>
          A critical configuration conflict was detected. This may impact your network connectivity. Please review the affected rules and resolve the conflict immediately.
        </AlertDescription>
      </Alert>
    </div>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
};

export const WithoutIcon: Story = {
  render: () => (
    <Alert variant="warning">
      <AlertTitle>No Icon Variant</AlertTitle>
      <AlertDescription>
        Alerts can also be displayed without icons. This variant is useful for simple messages.
      </AlertDescription>
    </Alert>
  ),
};

export const LongContent: Story = {
  render: () => (
    <Alert variant="info">
      <MessageSquare className="h-4 w-4" />
      <AlertTitle>Configuration Guidelines</AlertTitle>
      <AlertDescription>
        <p className="mb-2">
          When configuring your network interfaces, keep these best practices in mind:
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Always backup your configuration before making changes</li>
          <li>Test settings on a non-critical interface first</li>
          <li>Document all custom rules and their purpose</li>
          <li>Regularly review firewall rules for unused entries</li>
        </ul>
      </AlertDescription>
    </Alert>
  ),
};

export const DynamicAlert: Story = {
  render: function DynamicAlertStory() {
    const [isVisible, setIsVisible] = React.useState(false);

    return (
      <div className="space-y-4">
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
        >
          {isVisible ? 'Hide' : 'Show'} Dynamic Alert
        </button>
        {isVisible && (
          <Alert variant="success" live>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Success!</AlertTitle>
            <AlertDescription>
              This alert will be announced immediately to screen readers when shown.
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  },
};
