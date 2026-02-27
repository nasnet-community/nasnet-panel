import * as React from 'react';
import { ArrowLeft, ChevronLeft } from 'lucide-react';

import { Button, Icon } from '@nasnet/ui/primitives';

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
      className={`hover:bg-muted rounded-full transition-colors ${className}`}
      aria-label={ariaLabel}
    >
      <Icon
        icon={ArrowLeft}
        className="text-muted-foreground h-5 w-5"
      />
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
    <div className="flex w-80 items-center gap-3 border-b px-4 py-3">
      <MockBackButton
        to="/routers"
        ariaLabel="Back to router list"
      />
      <div>
        <h1 className="text-lg font-semibold">Router Settings</h1>
        <p className="text-muted-foreground text-xs">MikroTik-Home</p>
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
    <div className="text-muted-foreground flex items-center gap-2 text-sm">
      <MockBackButton
        to="/"
        ariaLabel="Back to home"
        className="h-8 w-8"
      />
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
      <div className="bg-card flex items-center justify-between border-b px-4 py-3">
        <MockBackButton
          to="/routers"
          ariaLabel="Back to router list"
        />
        <h1 className="text-base font-semibold">DHCP Leases</h1>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>
      <div className="text-muted-foreground p-4 text-sm">Page content...</div>
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
        <span className="text-muted-foreground text-sm">Default (ArrowLeft icon)</span>
      </div>
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-muted rounded-full"
          aria-label="Go back"
        >
          <Icon
            icon={ChevronLeft}
            className="text-muted-foreground h-5 w-5"
          />
        </Button>
        <span className="text-muted-foreground text-sm">Alternative (ChevronLeft icon)</span>
      </div>
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          aria-label="Go back"
        >
          <Icon
            icon={ArrowLeft}
            className="h-4 w-4"
          />
          Back
        </Button>
        <span className="text-muted-foreground text-sm">With label</span>
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
        <p className="text-muted-foreground h-5 text-sm">{lastAction || 'Click the button'}</p>
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
