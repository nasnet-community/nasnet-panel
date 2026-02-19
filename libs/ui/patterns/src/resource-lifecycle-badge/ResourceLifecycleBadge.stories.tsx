import { ResourceLifecycleBadge } from './ResourceLifecycleBadge';

import type { Meta, StoryObj } from '@storybook/react';


/**
 * All valid lifecycle states from Universal State v2 (ADR-012).
 */
const ALL_STATES = [
  'DRAFT',
  'VALIDATING',
  'VALID',
  'APPLYING',
  'ACTIVE',
  'DEGRADED',
  'ERROR',
  'DEPRECATED',
  'ARCHIVED',
] as const;

const meta: Meta<typeof ResourceLifecycleBadge> = {
  title: 'Patterns/ResourceLifecycleBadge',
  component: ResourceLifecycleBadge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Displays the lifecycle state of a Universal State v2 resource with colour-coded rings and contextual icons. Covers the full 9-state machine: DRAFT → VALIDATING → VALID → APPLYING → ACTIVE → DEGRADED / ERROR → DEPRECATED → ARCHIVED. Spinner animation is shown for VALIDATING and APPLYING states.',
      },
    },
  },
  argTypes: {
    state: {
      control: 'select',
      options: ALL_STATES,
      description: 'Resource lifecycle state from Universal State v2',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Badge size variant',
    },
    label: {
      control: 'text',
      description: 'Override the default human-readable state label',
    },
    showIcon: {
      control: 'boolean',
      description: 'Show the state icon/spinner before the label',
    },
    showTooltip: {
      control: 'boolean',
      description: 'Attach a native title tooltip with the state description',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ResourceLifecycleBadge>;

// ─── Individual state stories ──────────────────────────────────────────────

export const Default: Story = {
  args: {
    state: 'ACTIVE',
    size: 'md',
    showIcon: true,
    showTooltip: false,
  },
};

export const Draft: Story = {
  args: { state: 'DRAFT', size: 'md', showIcon: true },
};

export const Validating: Story = {
  args: { state: 'VALIDATING', size: 'md', showIcon: true },
  parameters: {
    docs: {
      description: {
        story: 'The VALIDATING state shows an animated spinner while the backend checks the configuration.',
      },
    },
  },
};

export const Valid: Story = {
  args: { state: 'VALID', size: 'md', showIcon: true },
};

export const Applying: Story = {
  args: { state: 'APPLYING', size: 'md', showIcon: true },
  parameters: {
    docs: {
      description: {
        story: 'The APPLYING state shows an animated spinner while the change is being written to the router.',
      },
    },
  },
};

export const Active: Story = {
  args: { state: 'ACTIVE', size: 'md', showIcon: true },
};

export const Degraded: Story = {
  args: { state: 'DEGRADED', size: 'md', showIcon: true },
};

export const Error: Story = {
  args: { state: 'ERROR', size: 'md', showIcon: true },
};

export const Deprecated: Story = {
  args: { state: 'DEPRECATED', size: 'md', showIcon: true },
};

export const Archived: Story = {
  args: { state: 'ARCHIVED', size: 'md', showIcon: true },
};

// ─── Size variants ─────────────────────────────────────────────────────────

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <ResourceLifecycleBadge state="ACTIVE" size="sm" showIcon />
      <ResourceLifecycleBadge state="ACTIVE" size="md" showIcon />
      <ResourceLifecycleBadge state="ACTIVE" size="lg" showIcon />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Three badge sizes — sm (10px), md (12px), and lg (14px) — for use in different density contexts.',
      },
    },
  },
};

// ─── All states at a glance ────────────────────────────────────────────────

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-2.5 items-start">
      {ALL_STATES.map((state) => (
        <ResourceLifecycleBadge
          key={state}
          state={state}
          size="md"
          showIcon
          showTooltip
        />
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All 9 lifecycle states. Hover each badge to see the native tooltip description. VALIDATING and APPLYING show spinners.',
      },
    },
  },
};

// ─── Without icons ─────────────────────────────────────────────────────────

export const NoIcon: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {ALL_STATES.map((state) => (
        <ResourceLifecycleBadge key={state} state={state} size="md" showIcon={false} />
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Label-only variant — useful in dense table columns where icon space is unavailable.',
      },
    },
  },
};

// ─── Custom label override ────────────────────────────────────────────────

export const CustomLabel: Story = {
  args: {
    state: 'ACTIVE',
    label: 'Running',
    size: 'md',
    showIcon: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'The `label` prop overrides the default state label for domain-specific terminology (e.g. "Running" instead of "Active").',
      },
    },
  },
};

// ─── In-context: resource table row ───────────────────────────────────────

export const InContext: Story = {
  render: () => (
    <div className="w-[480px] rounded-xl border border-border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-muted/40">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Interface</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">State</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {(
            [
              { name: 'ether1', state: 'ACTIVE' },
              { name: 'wg0',    state: 'VALIDATING' },
              { name: 'ether2', state: 'DEGRADED' },
              { name: 'ovpn1',  state: 'ERROR' },
              { name: 'ether3', state: 'DRAFT' },
            ] as const
          ).map(({ name, state }) => (
            <tr key={name}>
              <td className="px-4 py-2 font-mono text-sm text-foreground">{name}</td>
              <td className="px-4 py-2">
                <ResourceLifecycleBadge state={state} size="sm" showIcon />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Real-world example: sm badges embedded in an interface list table.',
      },
    },
  },
};
