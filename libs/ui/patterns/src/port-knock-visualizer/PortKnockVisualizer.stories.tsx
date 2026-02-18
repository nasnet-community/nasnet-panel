/**
 * Port Knock Visualizer Stories
 * Visual flow diagram for knock sequence progression
 *
 * Story: NAS-7.12 - Implement Port Knocking - Task 9
 */

import { PortKnockVisualizer } from './PortKnockVisualizer';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof PortKnockVisualizer> = {
  title: 'Patterns/Port Knocking/PortKnockVisualizer',
  component: PortKnockVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Visual flow diagram showing port knock sequence progression with protocol badges and timeout indicators.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    knockPorts: {
      description: 'Array of knock ports in sequence',
      control: 'object',
    },
    protectedPort: {
      description: 'Protected service port',
      control: 'number',
    },
    protectedProtocol: {
      description: 'Protected service protocol',
      control: 'select',
      options: ['tcp', 'udp'],
    },
    knockTimeout: {
      description: 'Time allowed between knocks',
      control: 'text',
    },
    accessTimeout: {
      description: 'Access duration after successful knock',
      control: 'text',
    },
    compact: {
      description: 'Compact mode with reduced spacing',
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof PortKnockVisualizer>;

/**
 * Simple 2-port knock sequence protecting SSH
 */
export const TwoPortSSH: Story = {
  args: {
    knockPorts: [
      { port: 1234, protocol: 'tcp', order: 1 },
      { port: 5678, protocol: 'tcp', order: 2 },
    ],
    protectedPort: 22,
    protectedProtocol: 'tcp',
    knockTimeout: '10s',
    accessTimeout: '1h',
    compact: false,
  },
};

/**
 * Complex 4-port knock sequence protecting HTTPS
 */
export const FourPortHTTPS: Story = {
  args: {
    knockPorts: [
      { port: 7000, protocol: 'tcp', order: 1 },
      { port: 8000, protocol: 'tcp', order: 2 },
      { port: 9000, protocol: 'tcp', order: 3 },
      { port: 10000, protocol: 'tcp', order: 4 },
    ],
    protectedPort: 443,
    protectedProtocol: 'tcp',
    knockTimeout: '15s',
    accessTimeout: '2h',
  },
};

/**
 * Maximum 8-port knock sequence
 */
export const EightPortMaximum: Story = {
  args: {
    knockPorts: [
      { port: 1111, protocol: 'tcp', order: 1 },
      { port: 2222, protocol: 'tcp', order: 2 },
      { port: 3333, protocol: 'tcp', order: 3 },
      { port: 4444, protocol: 'tcp', order: 4 },
      { port: 5555, protocol: 'tcp', order: 5 },
      { port: 6666, protocol: 'tcp', order: 6 },
      { port: 7777, protocol: 'tcp', order: 7 },
      { port: 8888, protocol: 'tcp', order: 8 },
    ],
    protectedPort: 3389,
    protectedProtocol: 'tcp',
    knockTimeout: '5s',
    accessTimeout: '30m',
  },
};

/**
 * Mixed TCP/UDP protocol sequence
 */
export const MixedProtocols: Story = {
  args: {
    knockPorts: [
      { port: 1234, protocol: 'tcp', order: 1 },
      { port: 5678, protocol: 'udp', order: 2 },
      { port: 9012, protocol: 'tcp', order: 3 },
    ],
    protectedPort: 22,
    protectedProtocol: 'tcp',
    knockTimeout: '10s',
    accessTimeout: '1h',
  },
};

/**
 * UDP-only knock sequence
 */
export const UDPOnly: Story = {
  args: {
    knockPorts: [
      { port: 53, protocol: 'udp', order: 1 },
      { port: 123, protocol: 'udp', order: 2 },
      { port: 161, protocol: 'udp', order: 3 },
    ],
    protectedPort: 161,
    protectedProtocol: 'udp',
    knockTimeout: '8s',
    accessTimeout: '45m',
  },
};

/**
 * Compact mode for space-constrained UIs
 */
export const CompactMode: Story = {
  args: {
    knockPorts: [
      { port: 1234, protocol: 'tcp', order: 1 },
      { port: 5678, protocol: 'tcp', order: 2 },
      { port: 9012, protocol: 'tcp', order: 3 },
      { port: 3456, protocol: 'tcp', order: 4 },
    ],
    protectedPort: 443,
    protectedProtocol: 'tcp',
    knockTimeout: '10s',
    accessTimeout: '1h',
    compact: true,
  },
};

/**
 * Mobile/Vertical layout (simulated with narrow viewport)
 */
export const MobileLayout: Story = {
  args: {
    knockPorts: [
      { port: 1234, protocol: 'tcp', order: 1 },
      { port: 5678, protocol: 'tcp', order: 2 },
      { port: 9012, protocol: 'tcp', order: 3 },
    ],
    protectedPort: 22,
    protectedProtocol: 'tcp',
    knockTimeout: '10s',
    accessTimeout: '1h',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
