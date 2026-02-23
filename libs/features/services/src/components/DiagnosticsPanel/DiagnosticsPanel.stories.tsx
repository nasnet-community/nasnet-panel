import { DiagnosticsPanel } from './DiagnosticsPanel';

import type { Meta, StoryObj } from '@storybook/react';

/**
 * DiagnosticsPanel is a platform-adaptive component backed by several Apollo
 * hooks (useDiagnosticHistory, useRunDiagnostics, useDiagnosticsProgressSubscription).
 * Wire up Apollo mocks or MSW handlers to see fully-populated diagnostic history
 * and real-time progress updates in Storybook.
 */
const meta: Meta<typeof DiagnosticsPanel> = {
  title: 'Features/Services/DiagnosticsPanel',
  component: DiagnosticsPanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Displays diagnostic test results with execution controls. Automatically selects Mobile (<640 px) or Desktop (≥640 px) presenter. Features diagnostic history with pass/fail indicators, manual run controls with real-time progress, and startup failure alerts. All data is fetched from the backend via Apollo hooks.',
      },
    },
  },
  argTypes: {
    routerId: { control: 'text' },
    instanceId: { control: 'text' },
    serviceName: { control: 'text' },
    maxHistory: { control: { type: 'number', min: 1, max: 50 } },
    className: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof DiagnosticsPanel>;

/**
 * Default view for a Tor service instance.
 * Without a mocked Apollo provider the panel shows in its loading state.
 */
export const Default: Story = {
  name: 'Default — Tor',
  args: {
    routerId: 'router-192-168-1-1',
    instanceId: 'tor-usa-01',
    serviceName: 'tor',
    maxHistory: 10,
  },
};

/**
 * sing-box instance — exercises a different serviceName which controls
 * which diagnostic tests the backend offers.
 */
export const SingBox: Story = {
  name: 'sing-box Instance',
  args: {
    routerId: 'router-192-168-1-1',
    instanceId: 'singbox-eu-02',
    serviceName: 'sing-box',
    maxHistory: 10,
  },
};

/**
 * Small history window — only the last 3 runs are fetched and displayed,
 * useful for dashboards with limited vertical space.
 */
export const SmallHistory: Story = {
  name: 'Small History Window',
  args: {
    routerId: 'router-10-0-0-1',
    instanceId: 'adguard-01',
    serviceName: 'adguard-home',
    maxHistory: 3,
  },
};

/**
 * Demonstrates the onDiagnosticsComplete callback, logged to the
 * Storybook Actions panel when a run completes.
 */
export const WithCompletionCallback: Story = {
  name: 'With Completion Callback',
  args: {
    routerId: 'router-192-168-1-1',
    instanceId: 'xray-01',
    serviceName: 'xray-core',
    maxHistory: 10,
    onDiagnosticsComplete: (results) => {
      console.log('[DiagnosticsPanel] completed', results);
    },
  },
};

/**
 * Custom container width — verifies the component handles constrained layouts.
 */
export const NarrowContainer: Story = {
  name: 'Narrow Container',
  args: {
    routerId: 'router-172-16-0-1',
    instanceId: 'psiphon-01',
    serviceName: 'psiphon',
    maxHistory: 5,
    className: 'max-w-sm',
  },
  parameters: {
    layout: 'centered',
  },
};
