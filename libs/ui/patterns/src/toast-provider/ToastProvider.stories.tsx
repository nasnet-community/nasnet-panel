/**
 * ToastProvider Stories
 *
 * Storybook stories demonstrating the toast notification system.
 * Shows all toast variants, queue behavior, and responsive positioning.
 *
 * @see NAS-4.19: Implement Notification/Toast System
 */

import { useEffect, useState } from 'react';

import { toast } from 'sonner';

import type { Meta, StoryObj } from '@storybook/react';

import {
  useNotificationStore,
  showSuccess,
  showError,
  showWarning,
  showInfo,
} from '@nasnet/state/stores';
import { Button } from '@nasnet/ui/primitives';

import { ToastProvider } from './ToastProvider';
import { useToast } from '../hooks/useToast';

// Wrapper component that provides toast context
function ToastDemoWrapper({ children }: { children: React.ReactNode }) {
  // Reset notification store between stories
  useEffect(() => {
    return () => {
      useNotificationStore.getState().clearAllNotifications();
      toast.dismiss();
    };
  }, []);

  return <ToastProvider>{children}</ToastProvider>;
}

// Demo component for interactive stories
function ToastDemo() {
  const toastApi = useToast();

  return (
    <div className="flex flex-col gap-4 p-4">
      <h2 className="text-lg font-semibold">Toast Variants</h2>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => toastApi.success('Operation completed successfully')}>
          Success Toast
        </Button>
        <Button
          variant="destructive"
          onClick={() =>
            toastApi.error('Connection failed', {
              message: 'Unable to reach the server. Check your network connection.',
            })
          }
        >
          Error Toast
        </Button>
        <Button
          variant="secondary"
          onClick={() => toastApi.warning('Battery low', { message: 'Connect to power soon' })}
        >
          Warning Toast
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toastApi.info('Update available', { message: 'Version 2.0 is ready to install' })
          }
        >
          Info Toast
        </Button>
      </div>
    </div>
  );
}

// Meta configuration
const meta: Meta<typeof ToastProvider> = {
  title: 'Patterns/Feedback/ToastProvider',
  component: ToastProvider,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Toast notification system using Sonner with Zustand store integration.

## Features
- **Four toast variants**: Success, Error, Warning, Info
- **Progress toasts**: For long-running operations with real-time updates
- **Queue management**: Max 3 visible toasts, older ones queued
- **Responsive positioning**: Bottom-right on desktop, bottom-center on mobile
- **Deduplication**: Same notification within 2 seconds is ignored
- **Accessibility**: WCAG compliant with proper ARIA attributes

## Usage

\`\`\`tsx
// Using the hook (recommended for components)
import { useToast } from '@nasnet/ui/patterns';

function MyComponent() {
  const toast = useToast();

  const handleSave = async () => {
    try {
      await saveData();
      toast.success('Saved successfully');
    } catch (error) {
      toast.error('Save failed', { message: error.message });
    }
  };
}

// Using convenience functions (for non-React code)
import { showSuccess, showError } from '@nasnet/ui/patterns';

showSuccess('Configuration applied');
showError('Network timeout');

// Progress toast with updates
const id = toast.progress('Uploading...', { progress: 0 });
toast.update(id, { progress: 50 });
toast.update(id, { progress: 100, title: 'Upload complete!' });

// Promise wrapper
toast.promise(fetchData(), {
  loading: 'Loading data...',
  success: 'Data loaded!',
  error: 'Failed to load data',
});
\`\`\`
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <ToastDemoWrapper>
        <Story />
      </ToastDemoWrapper>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ToastProvider>;

// Basic toast variants
export const SuccessToast: Story = {
  render: () => {
    const ShowToast = () => {
      useEffect(() => {
        showSuccess('Configuration saved successfully');
      }, []);
      return (
        <div className="p-8">
          <p className="text-muted-foreground">Success toast auto-dismisses after 4 seconds</p>
        </div>
      );
    };
    return <ShowToast />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Success toast with green accent. Auto-dismisses after 4 seconds.',
      },
    },
  },
};

export const ErrorToast: Story = {
  render: () => {
    const ShowToast = () => {
      const toastApi = useToast();
      useEffect(() => {
        toastApi.error('Connection failed', {
          message: 'Unable to connect to router. Please check your network settings.',
          action: {
            label: 'Retry',
            onClick: () => console.log('Retry clicked'),
          },
        });
      }, [toastApi]);
      return (
        <div className="p-8">
          <p className="text-muted-foreground">
            Error toast persists until dismissed. Includes retry action.
          </p>
        </div>
      );
    };
    return <ShowToast />;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Error toast with red accent. Does NOT auto-dismiss (persists until user dismisses). Can include action buttons like "Retry".',
      },
    },
  },
};

export const WarningToast: Story = {
  render: () => {
    const ShowToast = () => {
      useEffect(() => {
        showWarning('Low disk space', 'Only 2GB remaining on system drive');
      }, []);
      return (
        <div className="p-8">
          <p className="text-muted-foreground">Warning toast with amber accent.</p>
        </div>
      );
    };
    return <ShowToast />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Warning toast with amber accent. Auto-dismisses after 6 seconds.',
      },
    },
  },
};

export const InfoToast: Story = {
  render: () => {
    const ShowToast = () => {
      useEffect(() => {
        showInfo('Firmware update available', 'RouterOS 7.15 is ready to install');
      }, []);
      return (
        <div className="p-8">
          <p className="text-muted-foreground">Info toast with blue accent.</p>
        </div>
      );
    };
    return <ShowToast />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Info toast with blue accent. Auto-dismisses after 4 seconds.',
      },
    },
  },
};

// Progress toast
export const ProgressToast: Story = {
  render: () => {
    const ProgressDemo = () => {
      const toastApi = useToast();
      const [isUploading, setIsUploading] = useState(false);

      const simulateUpload = () => {
        if (isUploading) return;
        setIsUploading(true);

        const id = toastApi.progress('Uploading firmware...', { progress: 0 });

        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          if (progress <= 100) {
            toastApi.update(id, {
              progress,
              title: progress < 100 ? `Uploading... ${progress}%` : 'Processing...',
            });
          }
          if (progress > 100) {
            clearInterval(interval);
            toastApi.dismiss(id);
            toastApi.success('Firmware uploaded successfully');
            setIsUploading(false);
          }
        }, 500);
      };

      return (
        <div className="p-8">
          <Button onClick={simulateUpload} disabled={isUploading}>
            {isUploading ? 'Uploading...' : 'Start Upload'}
          </Button>
          <p className="mt-4 text-muted-foreground">
            Progress toast shows real-time upload progress (0-100%)
          </p>
        </div>
      );
    };
    return <ProgressDemo />;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Progress toast for long-running operations. Updates in real-time and converts to success/error upon completion.',
      },
    },
  },
};

// Multiple toasts (queue behavior)
export const QueueBehavior: Story = {
  render: () => {
    const QueueDemo = () => {
      const toastApi = useToast();

      const triggerMultiple = () => {
        toastApi.success('First notification');
        setTimeout(() => toastApi.info('Second notification'), 100);
        setTimeout(() => toastApi.warning('Third notification'), 200);
        setTimeout(() => toastApi.error('Fourth notification (queued)'), 300);
        setTimeout(() => toastApi.success('Fifth notification (queued)'), 400);
      };

      return (
        <div className="p-8">
          <div className="flex gap-2">
            <Button onClick={triggerMultiple}>Trigger 5 Toasts</Button>
            <Button variant="outline" onClick={() => toastApi.dismissAll()}>
              Clear All
            </Button>
          </div>
          <p className="mt-4 text-muted-foreground">
            Max 3 visible at once. Additional toasts are queued and shown as others dismiss.
          </p>
        </div>
      );
    };
    return <QueueDemo />;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates queue management. Maximum 3 toasts visible simultaneously. Older toasts are queued and shown after visible ones dismiss.',
      },
    },
  },
};

// Deduplication
export const Deduplication: Story = {
  render: () => {
    const DedupeDemo = () => {
      const triggerDuplicates = () => {
        // These should be deduplicated (same title within 2 seconds)
        showSuccess('Saved');
        showSuccess('Saved');
        showSuccess('Saved');
      };

      return (
        <div className="p-8">
          <Button onClick={triggerDuplicates}>Trigger Same Toast 3x</Button>
          <p className="mt-4 text-muted-foreground">
            Clicking triggers the same toast 3 times rapidly. Only 1 appears (deduplication within
            2-second window).
          </p>
        </div>
      );
    };
    return <DedupeDemo />;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Deduplication prevents spam. Same notification within 2 seconds of the previous identical one is ignored.',
      },
    },
  },
};

// Promise wrapper
export const PromiseToast: Story = {
  render: () => {
    const PromiseDemo = () => {
      const toastApi = useToast();
      const [isLoading, setIsLoading] = useState(false);

      const simulateAsync = async (shouldFail: boolean) => {
        if (isLoading) return;
        setIsLoading(true);

        const promise = new Promise<{ items: number }>((resolve, reject) => {
          setTimeout(() => {
            if (shouldFail) {
              reject(new Error('Network timeout'));
            } else {
              resolve({ items: 42 });
            }
          }, 2000);
        });

        try {
          await toastApi.promise(promise, {
            loading: 'Fetching data...',
            success: (data) => `Loaded ${data.items} items`,
            error: (e) => `Failed: ${(e as Error).message}`,
          });
        } catch {
          // Error handled by toast
        } finally {
          setIsLoading(false);
        }
      };

      return (
        <div className="p-8">
          <div className="flex gap-2">
            <Button onClick={() => simulateAsync(false)} disabled={isLoading}>
              Simulate Success
            </Button>
            <Button variant="destructive" onClick={() => simulateAsync(true)} disabled={isLoading}>
              Simulate Failure
            </Button>
          </div>
          <p className="mt-4 text-muted-foreground">
            Promise wrapper shows loading → success/error automatically.
          </p>
        </div>
      );
    };
    return <PromiseDemo />;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Promise wrapper automatically shows loading state, then success or error based on promise resolution.',
      },
    },
  },
};

// With action button
export const WithActionButton: Story = {
  render: () => {
    const ActionDemo = () => {
      const toastApi = useToast();

      const showWithUndo = () => {
        toastApi.success('Item deleted', {
          action: {
            label: 'Undo',
            onClick: () => {
              toastApi.info('Deletion undone');
            },
          },
          duration: 10000, // 10 seconds for undo window
        });
      };

      const showWithRetry = () => {
        toastApi.error('Upload failed', {
          message: 'Server returned 503',
          action: {
            label: 'Retry',
            onClick: () => {
              toastApi.progress('Retrying upload...');
            },
          },
        });
      };

      return (
        <div className="p-8">
          <div className="flex gap-2">
            <Button onClick={showWithUndo}>Delete with Undo</Button>
            <Button variant="destructive" onClick={showWithRetry}>
              Failed with Retry
            </Button>
          </div>
          <p className="mt-4 text-muted-foreground">
            Toasts can include action buttons for undo, retry, or other operations.
          </p>
        </div>
      );
    };
    return <ActionDemo />;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Toasts can include action buttons. Common patterns: "Undo" for deletions (10-second window), "Retry" for failed operations.',
      },
    },
  },
};

// Mobile positioning
export const MobilePositioning: Story = {
  render: () => <ToastDemo />,

  parameters: {
    docs: {
      description: {
        story:
          'On mobile devices (< 640px), toasts appear at bottom-center with offset to avoid bottom navigation.',
      },
    }
  },

  globals: {
    viewport: {
      value: 'mobile1',
      isRotated: false
    }
  }
};

// Interactive playground
export const Interactive: Story = {
  render: () => <ToastDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Interactive playground to test all toast variants.',
      },
    },
  },
};

// All variants showcase
export const AllVariants: Story = {
  render: () => {
    const AllVariantsDemo = () => {
      const toastApi = useToast();

      const showAll = () => {
        toastApi.success('Success message');
        setTimeout(() => toastApi.error('Error message'), 100);
        setTimeout(() => toastApi.warning('Warning message'), 200);
        setTimeout(() => toastApi.info('Info message'), 300);
      };

      return (
        <div className="p-8">
          <Button onClick={showAll}>Show All Variants</Button>
          <p className="mt-4 text-muted-foreground">
            Triggers all four toast variants to compare styling.
          </p>
        </div>
      );
    };
    return <AllVariantsDemo />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows all four toast variants side by side for visual comparison.',
      },
    },
  },
};
