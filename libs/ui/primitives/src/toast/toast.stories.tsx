import * as React from 'react';


import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from './toast';
import { Button } from '../button';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Toast> = {
  title: 'Primitives/Toast',
  component: Toast,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A toast notification component built on Radix UI Toast primitive. Supports multiple variants (default, success, warning, error, info) with swipe-to-dismiss and auto-close functionality.',
      },
    },
  },
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
        <ToastViewport />
      </ToastProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Toast>;

export const Default: Story = {
  render: () => (
    <Toast open>
      <div className="grid gap-1">
        <ToastTitle>Notification</ToastTitle>
        <ToastDescription>This is a default toast notification.</ToastDescription>
      </div>
      <ToastClose />
    </Toast>
  ),
};

export const Success: Story = {
  render: () => (
    <Toast variant="success" open>
      <div className="grid gap-1">
        <ToastTitle>Configuration Saved</ToastTitle>
        <ToastDescription>
          Your router settings have been updated successfully.
        </ToastDescription>
      </div>
      <ToastClose />
    </Toast>
  ),
};

export const Warning: Story = {
  render: () => (
    <Toast variant="warning" open>
      <div className="grid gap-1">
        <ToastTitle>High CPU Usage</ToastTitle>
        <ToastDescription>
          Router CPU usage is at 85%. Consider reviewing active processes.
        </ToastDescription>
      </div>
      <ToastClose />
    </Toast>
  ),
};

export const Error: Story = {
  render: () => (
    <Toast variant="error" open>
      <div className="grid gap-1">
        <ToastTitle>Connection Failed</ToastTitle>
        <ToastDescription>
          Unable to connect to the router. Please check your network.
        </ToastDescription>
      </div>
      <ToastClose />
    </Toast>
  ),
};

export const Info: Story = {
  render: () => (
    <Toast variant="info" open>
      <div className="grid gap-1">
        <ToastTitle>Firmware Update Available</ToastTitle>
        <ToastDescription>
          A new firmware version (7.12) is available for your router.
        </ToastDescription>
      </div>
      <ToastClose />
    </Toast>
  ),
};

export const WithAction: Story = {
  render: () => (
    <Toast open>
      <div className="grid gap-1">
        <ToastTitle>Scheduled Maintenance</ToastTitle>
        <ToastDescription>
          Router will reboot in 5 minutes for scheduled maintenance.
        </ToastDescription>
      </div>
      <ToastAction altText="Postpone maintenance">Postpone</ToastAction>
      <ToastClose />
    </Toast>
  ),
};

export const InteractiveDemo: Story = {
  render: function InteractiveToast() {
    const [toasts, setToasts] = React.useState<
      Array<{
        id: number;
        title: string;
        description: string;
        variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
      }>
    >([]);

    const addToast = (
      variant: 'default' | 'success' | 'warning' | 'error' | 'info'
    ) => {
      const messages = {
        default: {
          title: 'Notification',
          description: 'This is a default notification message.',
        },
        success: {
          title: 'Success!',
          description: 'Configuration applied successfully.',
        },
        warning: {
          title: 'Warning',
          description: 'Resource usage is approaching limits.',
        },
        error: {
          title: 'Error',
          description: 'Failed to apply configuration changes.',
        },
        info: {
          title: 'Information',
          description: 'New updates are available.',
        },
      };

      setToasts((prev) => [
        ...prev,
        {
          id: Date.now(),
          variant,
          ...messages[variant],
        },
      ]);

      // Auto-remove after 5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.slice(1));
      }, 5000);
    };

    return (
      <div className="flex flex-col gap-4">
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => addToast('default')}>
            Default
          </Button>
          <Button
            variant="outline"
            className="text-success"
            onClick={() => addToast('success')}
          >
            Success
          </Button>
          <Button
            variant="outline"
            className="text-warning"
            onClick={() => addToast('warning')}
          >
            Warning
          </Button>
          <Button
            variant="outline"
            className="text-error"
            onClick={() => addToast('error')}
          >
            Error
          </Button>
          <Button
            variant="outline"
            className="text-info"
            onClick={() => addToast('info')}
          >
            Info
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Click a button to show a toast. Toasts auto-dismiss after 5 seconds.
        </p>

        {/* Render toasts */}
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            variant={toast.variant}
            open
            onOpenChange={(open) => {
              if (!open) {
                setToasts((prev) => prev.filter((t) => t.id !== toast.id));
              }
            }}
          >
            <div className="grid gap-1">
              <ToastTitle>{toast.title}</ToastTitle>
              <ToastDescription>{toast.description}</ToastDescription>
            </div>
            <ToastClose />
          </Toast>
        ))}
      </div>
    );
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-[380px]">
      <Toast variant="default" open>
        <div className="grid gap-1">
          <ToastTitle>Default</ToastTitle>
          <ToastDescription>Default toast style.</ToastDescription>
        </div>
        <ToastClose />
      </Toast>

      <Toast variant="success" open>
        <div className="grid gap-1">
          <ToastTitle>Success</ToastTitle>
          <ToastDescription>Success toast style.</ToastDescription>
        </div>
        <ToastClose />
      </Toast>

      <Toast variant="warning" open>
        <div className="grid gap-1">
          <ToastTitle>Warning</ToastTitle>
          <ToastDescription>Warning toast style.</ToastDescription>
        </div>
        <ToastClose />
      </Toast>

      <Toast variant="error" open>
        <div className="grid gap-1">
          <ToastTitle>Error</ToastTitle>
          <ToastDescription>Error toast style.</ToastDescription>
        </div>
        <ToastClose />
      </Toast>

      <Toast variant="info" open>
        <div className="grid gap-1">
          <ToastTitle>Info</ToastTitle>
          <ToastDescription>Info toast style.</ToastDescription>
        </div>
        <ToastClose />
      </Toast>
    </div>
  ),
};
