/**
 * Storybook stories for LinkStatusIndicator
 * Displays link connectivity state (up / down / unknown) with an icon and label.
 */

import { LinkStatusIndicator } from './LinkStatusIndicator';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof LinkStatusIndicator> = {
  title: 'App/Network/LinkStatusIndicator',
  component: LinkStatusIndicator,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A compact inline indicator that communicates the physical link state of a network interface. ' +
          'Renders a directional arrow icon alongside a short label — green arrow-up for "Link Up", ' +
          'red arrow-down for "Link Down", and a neutral dash for "Unknown". ' +
          'Accepts an optional `className` for additional Tailwind utilities.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof LinkStatusIndicator>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const LinkUp: Story = {
  name: 'Link Up',
  args: {
    linkStatus: 'up',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Physical link is connected. Renders an upward green arrow with the label "Link Up". ' +
          'Used for interfaces with an active Ethernet or fibre connection.',
      },
    },
  },
};

export const LinkDown: Story = {
  name: 'Link Down',
  args: {
    linkStatus: 'down',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Physical link is disconnected. Renders a downward red arrow with the label "Link Down". ' +
          'Shown when a cable is unplugged or a transceiver has lost signal.',
      },
    },
  },
};

export const LinkUnknown: Story = {
  name: 'Link Unknown',
  args: {
    linkStatus: 'unknown',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Link state cannot be determined (e.g. virtual interfaces, tunnels, or interfaces whose ' +
          'driver does not report carrier state). Renders a neutral dash icon with the label "Unknown".',
      },
    },
  },
};

export const AllVariants: Story = {
  name: 'All Variants Side by Side',
  render: () => (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground w-24 text-xs">ether1:</span>
        <LinkStatusIndicator linkStatus="up" />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground w-24 text-xs">ether2:</span>
        <LinkStatusIndicator linkStatus="down" />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground w-24 text-xs">wlan1:</span>
        <LinkStatusIndicator linkStatus="unknown" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'All three link-status variants rendered together, mimicking a compact interface list row.',
      },
    },
  },
};

export const WithCustomClassName: Story = {
  name: 'Custom Class (large)',
  args: {
    linkStatus: 'up',
    className: 'text-base gap-2',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates that the `className` prop is forwarded to the outermost `<span>`, allowing ' +
          'consumers to override text size and gap without touching the component internals.',
      },
    },
  },
};

export const InTableCell: Story = {
  name: 'Inside Table Cell',
  render: () => (
    <table className="border-collapse text-sm">
      <thead>
        <tr className="text-muted-foreground text-left">
          <th className="pb-2 pr-8 font-medium">Interface</th>
          <th className="pb-2 pr-8 font-medium">Type</th>
          <th className="pb-2 font-medium">Link</th>
        </tr>
      </thead>
      <tbody className="divide-border divide-y">
        {[
          { name: 'ether1', type: 'Ethernet', status: 'up' as const },
          { name: 'ether2', type: 'Ethernet', status: 'down' as const },
          { name: 'wlan1', type: 'Wireless', status: 'unknown' as const },
          { name: 'bridge1', type: 'Bridge', status: 'up' as const },
        ].map((row) => (
          <tr key={row.name}>
            <td className="py-2 pr-8 font-mono text-xs">{row.name}</td>
            <td className="text-muted-foreground py-2 pr-8">{row.type}</td>
            <td className="py-2">
              <LinkStatusIndicator linkStatus={row.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story:
          'Realistic placement inside a data table — the typical usage context where ' +
          'LinkStatusIndicator appears alongside interface name and type columns.',
      },
    },
  },
};

export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
