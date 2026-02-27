/**
 * Storybook stories for the Home route
 *
 * The /home route renders the HomePage which displays router system information,
 * resource gauges (CPU/Memory/Disk), and routerboard hardware details.
 * All data is fetched via Apollo hooks using the Zustand connection store.
 */

import { HomePage } from '@/app/pages/home';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof HomePage> = {
  title: 'App/Home/HomePage',
  component: HomePage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Root home/dashboard page shown after connecting to a MikroTik router. ' +
          'Displays a SystemInfoCard (identity, model, RouterOS version, architecture), ' +
          'three ResourceGauge tiles (CPU, Memory, Disk) with live 5-second polling inside ' +
          'a System Resources card, and a HardwareCard showing routerboard details. ' +
          "All data is fetched from the connection store's current router IP.",
      },
    },
  },
  decorators: [
    (Story: React.ComponentType) => (
      <div style={{ minHeight: '600px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof HomePage>;

/**
 * Default render - shows the page shell in its loading state.
 */
export const Default: Story = {
  name: 'Default (loading state)',
  parameters: {
    docs: {
      description: {
        story:
          'Initial render before any router data has loaded. ResourceGauge tiles display ' +
          'skeleton placeholders; SystemInfoCard and HardwareCard show their loading states.',
      },
    },
  },
};

/**
 * Healthy system - all metrics within normal ranges.
 */
export const HealthySystem: Story = {
  name: 'Healthy System (annotated)',
  decorators: [
    (Story: React.ComponentType) => (
      <div className="relative">
        <Story />
        <div
          style={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            background: 'rgba(34,197,94,0.9)',
            color: '#fff',
            padding: '8px 14px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            pointerEvents: 'none',
          }}
        >
          Simulated: CPU 20% · RAM 40% · Disk 30% — all gauges green
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Represents a healthy router where CPU load is ~20%, memory usage ~40%, ' +
          'and disk usage ~30%. All three ResourceGauge tiles render in the green ' +
          '"healthy" status.',
      },
    },
  },
};

/**
 * Warning state - CPU or memory approaching warning threshold (>70%).
 */
export const WarningState: Story = {
  name: 'Warning State (annotated)',
  decorators: [
    (Story: React.ComponentType) => (
      <div className="relative">
        <Story />
        <div
          style={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            background: 'rgba(245,158,11,0.9)',
            color: '#fff',
            padding: '8px 14px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            pointerEvents: 'none',
          }}
        >
          Simulated: CPU 75% · RAM 80% — warning thresholds crossed
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Represents a router under load where CPU is ~75% and memory is ~80%. ' +
          'calculateStatus() returns "warning" for values between 70-90%, turning ' +
          'the gauge arc and label amber.',
      },
    },
  },
};

/**
 * Critical state - resource metrics above 90%.
 */
export const CriticalState: Story = {
  name: 'Critical State (annotated)',
  decorators: [
    (Story: React.ComponentType) => (
      <div className="relative">
        <Story />
        <div
          style={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            background: 'rgba(239,68,68,0.9)',
            color: '#fff',
            padding: '8px 14px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            pointerEvents: 'none',
          }}
        >
          Simulated: CPU 95% · RAM 92% · Disk 91% — critical
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Represents a router in critical resource usage. calculateStatus() returns ' +
          '"critical" for values >= 90%, turning gauge arcs red and triggering ' +
          'the destructive colour tokens.',
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
