/**
 * OfflineIndicator Stories
 *
 * Demonstrates the browser-level offline/online banner in all its variants.
 * Because the real component reacts to native `online`/`offline` browser events,
 * we use static mock wrappers so each state can be shown unconditionally in
 * Storybook without having to actually disconnect the browser.
 */

import * as React from 'react';

import { Wifi, WifiOff, X } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle, Button, cn } from '@nasnet/ui/primitives';

import type { Meta, StoryObj } from '@storybook/react';

// ===== Static mock components =====
// These replicate the rendered JSX of OfflineIndicator / OfflineIndicatorCompact
// but accept the offline/online state as a prop so stories are self-contained.

interface MockBannerProps {
  /** Whether the network is currently offline */
  isOffline?: boolean;
  /** Position of the banner within the demo container */
  position?: 'top' | 'bottom';
  /** Whether a dismiss button is rendered */
  dismissible?: boolean;
  /** Custom offline message */
  offlineMessage?: string;
  /** Custom online message */
  onlineMessage?: string;
  /** Additional CSS classes */
  className?: string;
}

function MockOfflineBanner({
  isOffline = true,
  position = 'top',
  dismissible = false,
  offlineMessage = "You're offline. Some features may be unavailable.",
  onlineMessage = "You're back online!",
  className,
}: MockBannerProps) {
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed) {
    return (
      <div className="text-muted-foreground rounded border p-4 text-sm">
        Banner was dismissed. Refresh the story to reset.
      </div>
    );
  }

  return (
    <div
      className={cn('px-4', position === 'top' ? 'pt-2' : 'pb-2', className)}
      role="alert"
      aria-live="assertive"
    >
      <Alert
        variant={isOffline ? 'destructive' : 'default'}
        className={cn(
          'mx-auto max-w-xl shadow-lg',
          'flex items-center justify-between',
          isOffline ?
            'bg-semantic-error border-semantic-error text-white'
          : 'bg-semantic-success border-semantic-success text-white'
        )}
      >
        <div className="flex items-center gap-3">
          {isOffline ?
            <WifiOff className="h-5 w-5 flex-shrink-0" />
          : <Wifi className="h-5 w-5 flex-shrink-0" />}

          <div>
            <AlertTitle className="text-sm font-semibold">
              {isOffline ? 'Offline' : 'Back Online'}
            </AlertTitle>
            <AlertDescription className="text-sm opacity-90">
              {isOffline ? offlineMessage : onlineMessage}
            </AlertDescription>
          </div>
        </div>

        {dismissible && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="-mr-2 text-white hover:bg-white/20"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </Alert>
    </div>
  );
}

interface MockCompactProps {
  /** Additional CSS classes */
  className?: string;
}

function MockOfflineCompact({ className }: MockCompactProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded px-2 py-1',
        'bg-semantic-error/10 text-semantic-error',
        'text-xs font-medium',
        className
      )}
      role="status"
      aria-label="You are currently offline"
    >
      <WifiOff className="h-3.5 w-3.5" />
      <span>Offline</span>
    </div>
  );
}

// ===== Meta =====

const meta: Meta<typeof MockOfflineBanner> = {
  title: 'Patterns/Connection/OfflineIndicator',
  component: MockOfflineBanner,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A fixed-position banner that alerts users when the browser loses network ' +
          'connectivity. It monitors native `online`/`offline` events and can briefly ' +
          'display a "Back Online" confirmation when the connection is restored. A compact ' +
          'icon-only variant (`OfflineIndicatorCompact`) is also exported for use in ' +
          'headers and navigation bars. These stories use static mock presenters so all ' +
          'states are independently viewable without disconnecting the browser.',
      },
    },
  },
  argTypes: {
    isOffline: {
      control: 'boolean',
      description: 'Simulate offline (true) or back-online (false) state',
    },
    position: {
      control: 'radio',
      options: ['top', 'bottom'],
      description: 'Banner position within the viewport',
    },
    dismissible: {
      control: 'boolean',
      description: 'Show a dismiss button on the banner',
    },
    offlineMessage: {
      control: 'text',
      description: 'Custom offline message text',
    },
    onlineMessage: {
      control: 'text',
      description: 'Custom back-online message text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof MockOfflineBanner>;

// ===== Stories =====

/**
 * Default offline banner – appears at the top of the viewport with default messaging.
 */
export const Offline: Story = {
  args: {
    isOffline: true,
    position: 'top',
    dismissible: false,
    offlineMessage: "You're offline. Some features may be unavailable.",
  },
};

/**
 * Back-online confirmation – shown briefly after the connection is restored.
 */
export const BackOnline: Story = {
  args: {
    isOffline: false,
    position: 'top',
    dismissible: false,
    onlineMessage: "You're back online!",
  },
};

/**
 * Bottom-positioned banner – useful for apps with top navigation bars.
 */
export const BottomPosition: Story = {
  args: {
    isOffline: true,
    position: 'bottom',
    dismissible: false,
    offlineMessage: "You're offline. Some features may be unavailable.",
  },
};

/**
 * Dismissible offline banner – adds a close button so users can hide the banner.
 */
export const Dismissible: Story = {
  args: {
    isOffline: true,
    position: 'top',
    dismissible: true,
    offlineMessage: "You're offline. Some features may be unavailable.",
  },
  parameters: {
    docs: {
      description: {
        story:
          'Clicking the × button dismisses the banner. The banner auto-reappears if the ' +
          'network goes offline again (automatic behaviour in the live component).',
      },
    },
  },
};

/**
 * Custom messages – router-specific copy for a more contextual experience.
 */
export const CustomMessages: Story = {
  args: {
    isOffline: true,
    position: 'top',
    dismissible: false,
    offlineMessage: 'Cannot reach the router. Operating in read-only mode with cached data.',
    onlineMessage: 'Router connection restored. Live data is now available.',
  },
};

/**
 * Compact offline indicator – icon-only variant intended for headers and nav bars.
 */
export const Compact: Story = {
  render: () => (
    <div className="bg-card flex items-center gap-4 rounded border p-4">
      <span className="text-sm font-medium">App Header</span>
      <div className="ml-auto">
        <MockOfflineCompact />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '`OfflineIndicatorCompact` renders a small icon + label badge suitable for ' +
          'embedding in navigation headers without taking up vertical space.',
      },
    },
  },
};

/**
 * Side-by-side comparison of offline and back-online states.
 */
export const BothStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-muted-foreground mb-2 text-xs font-medium">Offline state</p>
        <MockOfflineBanner
          isOffline={true}
          position="top"
        />
      </div>
      <div>
        <p className="text-muted-foreground mb-2 text-xs font-medium">Back-online state</p>
        <MockOfflineBanner
          isOffline={false}
          position="top"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Quick visual comparison of both states.',
      },
    },
  },
};
