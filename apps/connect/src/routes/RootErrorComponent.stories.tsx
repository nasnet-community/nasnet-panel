import type { Meta, StoryObj } from '@storybook/react';

function RootErrorComponent({ error }: { error: Error }) {
  return (
    <div
      className="bg-background flex min-h-screen items-center justify-center"
      role="alert"
      aria-live="assertive"
    >
      <div className="bg-card text-card-foreground border-border max-w-md rounded-lg border p-8 shadow-lg">
        <h1 className="text-error mb-4 text-2xl font-bold">Application Error</h1>
        <p className="text-muted-foreground mb-4">{error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:ring-ring min-h-[44px] rounded px-4 py-2 focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          Reload Application
        </button>
        <pre className="bg-muted text-foreground mt-4 overflow-auto rounded p-4 text-xs">
          {error.stack}
        </pre>
      </div>
    </div>
  );
}

const meta: Meta<typeof RootErrorComponent> = {
  title: 'App/Root/ErrorState',
  component: RootErrorComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Root-level error boundary component. Displays application errors with error details and reload button.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default error state with sample error message
 */
export const Default: Story = {
  args: {
    error: new Error('Something went wrong. Please try again later.'),
  },
};

/**
 * Error with detailed stack trace (visible in development)
 */
export const WithStackTrace: Story = {
  args: {
    error: new Error(
      'Failed to fetch router configuration: Network timeout occurred after 30 seconds'
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Error state showing full stack trace. Stack traces are only displayed in development mode.',
      },
    },
  },
};

/**
 * Critical system error example
 */
export const CriticalError: Story = {
  args: {
    error: new Error('Critical: Database connection lost. Unable to continue.'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Example of a critical system error that requires application reload.',
      },
    },
  },
};

/**
 * Error state on mobile view
 */
export const Mobile: Story = {
  args: {
    error: new Error('Something went wrong. Please try again later.'),
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story:
          'Error state rendered on mobile viewport with optimized spacing and touch-friendly button.',
      },
    },
  },
};

/**
 * Error state on desktop view
 */
export const Desktop: Story = {
  args: {
    error: new Error('Something went wrong. Please try again later.'),
  },
  parameters: {
    viewport: { defaultViewport: 'desktop' },
    docs: {
      description: {
        story: 'Error state rendered on desktop viewport with full error card layout.',
      },
    },
  },
};
