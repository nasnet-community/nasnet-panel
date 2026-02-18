import * as React from 'react';

import { ArrowLeft, ChevronLeft } from 'lucide-react';

import { Button } from '@nasnet/ui/primitives';

import type { Meta, StoryObj } from '@storybook/react';

// Mock BackButton for Storybook since it depends on TanStack Router
interface MockBackButtonProps {
  to?: string;
  ariaLabel?: string;
  className?: string;
  onClick?: () => void;
}

function MockBackButton({
  to = '/',
  ariaLabel = 'Go back',
  className = '',
  onClick,
}: MockBackButtonProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      console.log(`Navigate to: ${to}`);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className={`rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${className}`}
      aria-label={ariaLabel}
    >
      <ArrowLeft className="h-5 w-5 text-slate-700 dark:text-slate-300" />
    </Button>
  );
}

const meta: Meta<typeof MockBackButton> = {
  title: 'Patterns/BackButton',
  component: MockBackButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A reusable back navigation button with an arrow icon. Uses TanStack Router for navigation. Provides accessible navigation with proper ARIA labels.',
      },
    },
  },
  argTypes: {
    to: {
      control: 'text',
      description: 'The route to navigate to',
    },
    ariaLabel: {
      control: 'text',
      description: 'Accessible label for screen readers',
    },
  },
};

export default meta;
type Story = StoryObj<typeof MockBackButton>;

export const Default: Story = {
  args: {
    to: '/routers',
    ariaLabel: 'Go back',
  },
};

export const WithCustomLabel: Story = {
  args: {
    to: '/routers',
    ariaLabel: 'Back to router list',
  },
};

export const InPageHeader: Story = {
  render: () => (
    <div className="flex items-center gap-3 w-80 px-4 py-3 border-b">
      <MockBackButton to="/routers" ariaLabel="Back to router list" />
      <div>
        <h1 className="text-lg font-semibold">Router Settings</h1>
        <p className="text-xs text-muted-foreground">MikroTik-Home</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'BackButton used in a page header context with title.',
      },
    },
  },
};

export const InBreadcrumb: Story = {
  render: () => (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <MockBackButton to="/" ariaLabel="Back to home" className="h-8 w-8" />
      <span>/</span>
      <span>Routers</span>
      <span>/</span>
      <span className="text-foreground font-medium">MikroTik-Home</span>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'BackButton used alongside breadcrumb navigation.',
      },
    },
  },
};

export const InMobileHeader: Story = {
  render: () => (
    <div className="w-80">
      <div className="flex items-center justify-between px-4 py-3 bg-card border-b">
        <MockBackButton to="/routers" ariaLabel="Back to router list" />
        <h1 className="text-base font-semibold">DHCP Leases</h1>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>
      <div className="p-4 text-sm text-muted-foreground">
        Page content...
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'BackButton in a mobile-style header with centered title.',
      },
    },
  },
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <MockBackButton to="/" />
        <span className="text-sm text-muted-foreground">Default (ArrowLeft icon)</span>
      </div>
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Go back"
        >
          <ChevronLeft className="h-5 w-5 text-slate-700 dark:text-slate-300" />
        </Button>
        <span className="text-sm text-muted-foreground">Alternative (ChevronLeft icon)</span>
      </div>
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <span className="text-sm text-muted-foreground">With label</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different visual variants for back navigation.',
      },
    },
  },
};

export const Interactive: Story = {
  render: () => {
    const [lastAction, setLastAction] = React.useState<string>('');

    return (
      <div className="flex flex-col items-center gap-4">
        <MockBackButton
          to="/routers"
          ariaLabel="Back to router list"
          onClick={() => setLastAction('Navigating to /routers...')}
        />
        <p className="text-sm text-muted-foreground h-5">
          {lastAction || 'Click the button'}
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo showing click feedback.',
      },
    },
  },
};
