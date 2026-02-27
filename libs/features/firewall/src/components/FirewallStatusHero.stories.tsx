/**
 * FirewallStatusHero Storybook Stories
 *
 * Interactive stories for the firewall status hero dashboard component.
 * Demonstrates the three protection statuses, loading skeleton, and stat cards.
 *
 * @module @nasnet/features/firewall
 */

import { FirewallStatusHero } from './FirewallStatusHero';

import type { Meta, StoryObj } from '@storybook/react';

/**
 * FirewallStatusHero - Firewall overview stats grid
 *
 * A 4-card stats grid that summarises the current firewall posture at a glance.
 * Rendered at the top of the Firewall page as the primary status indicator.
 *
 * ## Cards
 *
 * | Card | Icon | Content |
 * |------|------|---------|
 * | Status | Shield (variant) | Protection level: Protected / Warning / Minimal |
 * | Total Rules | FileText | Combined count of filter + NAT rules |
 * | Active Rules | Shield | Enabled rules vs total (e.g., 14/16) |
 * | Updated | Clock | Timestamp of last data fetch + refresh button |
 *
 * ## Protection Status Logic
 *
 * | Status | Condition | Badge Color |
 * |--------|-----------|-------------|
 * | `protected` | Has filter rules AND at least one drop/reject rule | Green |
 * | `warning` | Has filter rules but NO drop/reject rules | Amber |
 * | `minimal` | Zero filter rules | Muted gray |
 *
 * ## Features
 *
 * - **Loading skeleton**: Animates while filter + NAT queries are pending
 * - **Refresh button**: Clock card contains a spin-on-fetch RefreshCw button
 * - **Responsive grid**: 2-column on mobile → 4-column on `md:` and above
 * - **Real-time data**: Fetches from `useFilterRules` + `useNATRules` hooks
 *
 * ## Usage
 *
 * ```tsx
 * import { FirewallStatusHero } from '@nasnet/features/firewall';
 *
 * <FirewallStatusHero className="mb-6" />
 * ```
 */
const meta: Meta<typeof FirewallStatusHero> = {
  title: 'Features/Firewall/FirewallStatusHero',
  component: FirewallStatusHero,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A 4-card stats grid summarising firewall health. Protection status is derived from the presence of filter rules and drop/reject actions. Fetches data from the router API via React Query.',
      },
    },
    a11y: {
      config: {
        rules: [{ id: 'color-contrast', enabled: true }],
      },
    },
  },
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes applied to the 4-card grid wrapper.',
      table: {
        type: { summary: 'string' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Stories
// ============================================================================

/**
 * Default
 *
 * Component as used in production — connects to the active router via React Query.
 * Displays live firewall statistics fetched from the router API.
 */
export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          'Default rendering connected to the live router API. Displays the loading skeleton while queries are pending, then shows real firewall stats.',
      },
    },
  },
};

/**
 * Protected Status
 *
 * Illustrates what the component looks like when the router has an active,
 * well-configured firewall with drop/reject rules present.
 *
 * The green ShieldCheck icon and "Protected" label are rendered by the component
 * when: filterRulesCount > 0 AND at least one enabled drop or reject rule exists.
 */
export const ProtectedStatus: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          'Protected state — displayed when filter rules exist and at least one enabled drop/reject rule is present. The status card renders with a green ShieldCheck icon and "Protected" label.',
      },
    },
    msw: {
      handlers: [
        {
          url: '/api/routers/:routerId/firewall/filter',
          method: 'get',
          response: {
            data: [
              {
                id: '*1',
                chain: 'input',
                action: 'accept',
                disabled: false,
                order: 0,
                connectionState: ['established', 'related'],
              },
              {
                id: '*2',
                chain: 'input',
                action: 'accept',
                disabled: false,
                order: 1,
                protocol: 'tcp',
                dstPort: '22',
                srcAddress: '192.168.88.0/24',
              },
              {
                id: '*3',
                chain: 'input',
                action: 'drop',
                disabled: false,
                order: 2,
                comment: 'Drop all other input',
              },
              {
                id: '*4',
                chain: 'forward',
                action: 'accept',
                disabled: false,
                order: 3,
                connectionState: ['established', 'related'],
              },
              {
                id: '*5',
                chain: 'forward',
                action: 'drop',
                disabled: false,
                order: 4,
                comment: 'Drop invalid',
              },
            ],
          },
        },
        {
          url: '/api/routers/:routerId/firewall/nat',
          method: 'get',
          response: {
            data: [
              {
                id: '*1',
                chain: 'srcnat',
                action: 'masquerade',
                disabled: false,
                order: 0,
                outInterface: 'ether1',
                comment: 'Masquerade',
              },
              {
                id: '*2',
                chain: 'dstnat',
                action: 'dst-nat',
                disabled: false,
                order: 1,
                protocol: 'tcp',
                dstPort: '80',
                toAddresses: '192.168.1.100',
                toPorts: '8080',
              },
            ],
          },
        },
      ],
    },
  },
};

/**
 * Warning Status
 *
 * Firewall has filter rules but none of them drop or reject traffic.
 * This is a partial configuration — traffic is being inspected but not blocked.
 */
export const WarningStatus: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          'Warning state — filter rules exist but no drop or reject actions are present. The status card shows an amber ShieldAlert icon. Indicates the firewall is permissive.',
      },
    },
    msw: {
      handlers: [
        {
          url: '/api/routers/:routerId/firewall/filter',
          method: 'get',
          response: {
            data: [
              {
                id: '*1',
                chain: 'input',
                action: 'accept',
                disabled: false,
                order: 0,
                comment: 'Accept all — no drop rules',
              },
              {
                id: '*2',
                chain: 'forward',
                action: 'accept',
                disabled: false,
                order: 1,
                connectionState: ['established', 'related'],
              },
              {
                id: '*3',
                chain: 'forward',
                action: 'log',
                disabled: false,
                order: 2,
                comment: 'Log only, no drops',
              },
            ],
          },
        },
        {
          url: '/api/routers/:routerId/firewall/nat',
          method: 'get',
          response: { data: [] },
        },
      ],
    },
  },
};

/**
 * Minimal Status
 *
 * No filter rules are configured at all. This is a freshly provisioned router
 * or one where all filter rules have been removed.
 */
export const MinimalStatus: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          'Minimal state — zero filter rules. Status card renders with a muted gray Shield icon. Warns that the firewall is essentially unconfigured.',
      },
    },
    msw: {
      handlers: [
        {
          url: '/api/routers/:routerId/firewall/filter',
          method: 'get',
          response: { data: [] },
        },
        {
          url: '/api/routers/:routerId/firewall/nat',
          method: 'get',
          response: { data: [] },
        },
      ],
    },
  },
};

/**
 * With Custom ClassName
 *
 * Demonstrates className prop for spacing and layout control within a page.
 */
export const WithCustomClassName: Story = {
  args: {
    className: 'mb-8 px-4',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Custom className applied to the 4-card grid. Use this to control spacing within page layouts.',
      },
    },
  },
};

/**
 * Narrow Layout (2-column grid)
 *
 * Below the `md:` breakpoint, the grid collapses from 4 columns to 2 columns.
 * Shown here via a constrained container to simulate a narrow panel.
 */
export const NarrowLayout: Story = {
  args: {},
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '480px', padding: '16px' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Constrained to 480px to show the 2-column grid layout that activates below the md: breakpoint. The Status and Total Rules cards sit on row 1; Active and Updated on row 2.',
      },
    },
  },
};
