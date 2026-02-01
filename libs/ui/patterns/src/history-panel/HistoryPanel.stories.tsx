/**
 * History Panel Storybook Stories
 *
 * Demonstrates the history panel components with sample data.
 *
 * @see NAS-4.24: Implement Undo/Redo History
 */

import type { Meta, StoryObj } from '@storybook/react';
import React, { useEffect } from 'react';
import { HistoryPanel } from './HistoryPanel';
import { HistoryPanelDesktop } from './HistoryPanelDesktop';
import { HistoryPanelMobile } from './HistoryPanelMobile';
import { useHistoryStore } from '@nasnet/state/stores';
import type { HistoryPanelProps } from './types';

// Reset history store before each story
function StoryWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    useHistoryStore.setState({ past: [], future: [] });
    return () => {
      useHistoryStore.setState({ past: [], future: [] });
    };
  }, []);

  return <>{children}</>;
}

// Decorator to add sample history actions
function withSampleHistory(Story: React.ComponentType) {
  useEffect(() => {
    const { pushAction, undo } = useHistoryStore.getState();

    // Add sample actions
    pushAction({
      type: 'create',
      description: 'Create bridge interface',
      scope: 'global',
      execute: () => {},
      undo: () => {},
      resourceType: 'network.bridge',
    });

    pushAction({
      type: 'edit',
      description: 'Edit interface name',
      scope: 'page',
      execute: () => {},
      undo: () => {},
      resourceId: 'ether1',
      resourceType: 'network.interface',
    });

    pushAction({
      type: 'edit',
      description: 'Change IP address',
      scope: 'page',
      execute: () => {},
      undo: () => {},
    });

    pushAction({
      type: 'reorder',
      description: 'Reorder firewall rules',
      scope: 'global',
      execute: () => {},
      undo: () => {},
      resourceType: 'firewall.rule',
    });

    pushAction({
      type: 'delete',
      description: 'Delete unused address',
      scope: 'global',
      execute: () => {},
      undo: () => {},
    });

    // Undo one action to show future
    undo();
  }, []);

  return <Story />;
}

const meta: Meta<typeof HistoryPanel> = {
  title: 'Patterns/HistoryPanel',
  component: HistoryPanel,
  decorators: [
    (Story) => (
      <StoryWrapper>
        <Story />
      </StoryWrapper>
    ),
  ],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
History Panel displays the undo/redo history with the ability to jump to any point.

## Features

- Shows all past and future actions
- Click to jump to any point in history
- Keyboard navigation (Arrow keys, Enter)
- Platform-specific presenters (Desktop/Mobile)
- Screen reader accessible

## Usage

\`\`\`tsx
import { HistoryPanel, useHistoryShortcuts } from '@nasnet/ui/patterns';

function App() {
  // Enable keyboard shortcuts (Cmd+Z, Cmd+Shift+Z)
  useHistoryShortcuts();

  const [showHistory, setShowHistory] = useState(false);

  return (
    <>
      <Button onClick={() => setShowHistory(true)}>
        Show History
      </Button>

      {showHistory && (
        <HistoryPanel onClose={() => setShowHistory(false)} />
      )}
    </>
  );
}
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    onClose: { action: 'closed' },
    maxHeight: {
      control: { type: 'number', min: 100, max: 600 },
    },
  },
};

export default meta;
type Story = StoryObj<typeof HistoryPanel>;

/**
 * Default history panel with sample actions
 */
export const Default: Story = {
  decorators: [withSampleHistory],
};

/**
 * Empty state when no history
 */
export const Empty: Story = {
  name: 'Empty State',
};

/**
 * Desktop variant (forced)
 */
export const Desktop: Story = {
  render: (args) => <HistoryPanelDesktop {...args} />,
  decorators: [withSampleHistory],
};

/**
 * Mobile variant (forced)
 */
export const Mobile: Story = {
  render: (args) => <HistoryPanelMobile {...args} />,
  decorators: [withSampleHistory],
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * With many actions (scrolling)
 */
export const ManyActions: Story = {
  name: 'Many Actions (Scrolling)',
  decorators: [
    (Story) => {
      useEffect(() => {
        const { pushAction } = useHistoryStore.getState();

        // Add many actions
        for (let i = 1; i <= 15; i++) {
          pushAction({
            type: i % 3 === 0 ? 'create' : i % 3 === 1 ? 'edit' : 'delete',
            description: `Action ${i}: ${
              i % 3 === 0
                ? 'Create resource'
                : i % 3 === 1
                ? 'Edit configuration'
                : 'Delete item'
            }`,
            scope: i % 4 === 0 ? 'global' : 'page',
            execute: () => {},
            undo: () => {},
          });
        }
      }, []);

      return <Story />;
    },
  ],
};

/**
 * Keyboard navigation demo
 */
export const KeyboardNavigation: Story = {
  name: 'Keyboard Navigation',
  decorators: [withSampleHistory],
  parameters: {
    docs: {
      description: {
        story: `
Use keyboard to navigate:
- **Arrow Up/Down**: Move focus between items
- **Enter/Space**: Jump to focused item
- **Home/End**: Jump to first/last item
- **Escape**: Close panel
        `,
      },
    },
  },
};
