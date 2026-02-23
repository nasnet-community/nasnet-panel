/**
 * Storybook stories for PortKnockingPage
 *
 * Demonstrates the port knocking page with its two tabs (Sequences and Knock Log),
 * the informational info card, the Create Sequence button, and the slide-over
 * Sheet used for creating and editing sequences.
 */

import { PortKnockingPage } from './PortKnockingPage';

import type { Meta, StoryObj } from '@storybook/react';

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof PortKnockingPage> = {
  title: 'Features/Firewall/PortKnockingPage',
  component: PortKnockingPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Full-page view for managing MikroTik port knocking sequences. ' +
          'Port knocking hides sensitive services (e.g., SSH) behind a secret sequence of ' +
          'connection attempts to specific ports, preventing port scanning and unauthorised access. ' +
          'The page provides a tabbed interface: "Sequences" for CRUD operations and "Knock Log" ' +
          'for reviewing recent knock attempts. A slide-over Sheet handles create/edit forms.',
      },
    },
  },
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS class names applied to the root container',
    },
  },
};

export default meta;
type Story = StoryObj<typeof PortKnockingPage>;

// ============================================================================
// Stories
// ============================================================================

/**
 * Default state — sequences tab active, no dialog open.
 */
export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          'Default page state: the Sequences tab is active, showing the PortKnockSequenceManager ' +
          'component and the informational card explaining what port knocking is.',
      },
    },
  },
};

/**
 * Custom container width to illustrate how the layout adapts.
 */
export const NarrowContainer: Story = {
  args: {
    className: 'max-w-2xl mx-auto',
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story:
          'Page rendered inside a constrained container width, simulating a tablet or narrow ' +
          'desktop viewport. Verify that the header row wraps gracefully and the Create Sequence ' +
          'button remains accessible.',
      },
    },
  },
};

/**
 * Knock Log tab pre-selected.
 */
export const KnockLogTab: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          'The Knock Log tab shows a chronological list of knock attempts. This story ' +
          'pre-clicks the tab via the play function to surface the PortKnockLogViewer.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const logTab = canvasElement.querySelector('[value="log"]') as HTMLElement | null;
    logTab?.click();
  },
};

/**
 * Additional className applied — verifies className prop threading.
 */
export const WithCustomClass: Story = {
  args: {
    className: 'border rounded-xl p-8 bg-muted/30',
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story:
          'Demonstrates the `className` prop forwarding. A border, rounded corners, and ' +
          'a subtle muted background are applied to the root div.',
      },
    },
  },
};

/**
 * Dark mode variant.
 */
export const DarkMode: Story = {
  args: {},
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story:
          'Dark mode rendering verifying that the Shield icon, card descriptions, ' +
          'and tab triggers all use semantic colour tokens correctly.',
      },
    },
  },
};
