/**
 * Storybook stories for the Dashboard route
 *
 * The /dashboard route renders the DashboardPage which shows a hero StatusCard,
 * VPN quick toggle, quick action buttons, resource gauges (CPU/Memory/Disk),
 * and hardware details. Data is fetched via Apollo hooks using the router IP
 * from Zustand connection store.
 */

import { DashboardPage } from '@/app/pages/dashboard/DashboardPage';

import type { Meta, StoryObj } from '@storybook/react';


const meta: Meta<typeof DashboardPage> = {
  title: 'App/Dashboard/DashboardPage',
  component: DashboardPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Main dashboard view for a connected MikroTik router. Displays a hero ' +
          'StatusCard with overall network health, a VPNCardEnhanced toggle, a row of ' +
          'QuickActionButton shortcuts (WiFi, Network, Firewall, Settings, Troubleshoot), ' +
          'resource monitoring gauges (CPU, Memory, Disk), and a HardwareCard. ' +
          'All data is fetched from the Zustand connection store\'s current router IP.',
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
type Story = StoryObj<typeof DashboardPage>;

/**
 * Default render - shows the dashboard shell in its loading state.
 * Without a live Apollo/Zustand context, gauges display skeleton placeholders.
 */
export const Default: Story = {
  name: 'Default (loading state)',
  parameters: {
    docs: {
      description: {
        story:
          'Initial render before router data has loaded. StatusCard shows "Loading...", ' +
          'ResourceGauge tiles display skeleton placeholders, and SystemInfoCard shows ' +
          'its loading state.',
      },
    },
  },
};

/**
 * Healthy system - all resource metrics within normal ranges.
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
          Simulated: CPU 15% · RAM 35% · Disk 25% — All Systems Online
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Represents a healthy router where all resource metrics are within normal ' +
          'thresholds. The StatusCard displays "All Systems Online" with green status. ' +
          'All three ResourceGauge tiles render in green "healthy" status.',
      },
    },
  },
};

/**
 * Warning state - one or more resources approaching warning thresholds.
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
          Simulated: CPU 78% · RAM 82% — Attention Needed
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Represents a router under load where CPU is ~78% and memory is ~82%. ' +
          'StatusCard shows "Attention Needed" with warning status. ' +
          'calculateStatus() returns "warning" for values between 70-90%.',
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
          Simulated: CPU 96% · RAM 93% · Disk 91% — System Issues Detected
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Represents a router in critical resource usage. StatusCard shows ' +
          '"System Issues Detected" with error status. calculateStatus() returns ' +
          '"critical" for values >= 90%, turning gauge arcs red.',
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
