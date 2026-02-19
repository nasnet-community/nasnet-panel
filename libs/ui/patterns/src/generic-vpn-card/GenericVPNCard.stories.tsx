/**
 * GenericVPNCard Storybook Stories
 *
 * Demonstrates the GenericVPNCard pattern for L2TP, PPTP, and SSTP
 * VPN interface display. Covers connected, disconnected, disabled,
 * and clickable interactive states.
 *
 * @module @nasnet/ui/patterns/generic-vpn-card
 */

import { fn } from '@storybook/test';

import { GenericVPNCard } from './GenericVPNCard';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof GenericVPNCard> = {
  title: 'Patterns/VPN/GenericVPNCard',
  component: GenericVPNCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A card component for displaying generic VPN interface information (L2TP, PPTP, SSTP).

## Features
- Status indicator (Connected / Disconnected / Disabled)
- Protocol label (L2TP, PPTP, SSTP)
- Remote server address
- Optional username, comment, and certificate verification fields
- Clickable card variant with hover and focus states
- WCAG AAA accessible with keyboard support

## Usage
\`\`\`tsx
import { GenericVPNCard } from '@nasnet/ui/patterns';

<GenericVPNCard
  vpnInterface={l2tpInterface}
  onClick={() => openDetail(l2tpInterface.id)}
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    onClick: {
      description: 'Optional click handler — enables interactive card mode',
      action: 'clicked',
    },
  },
  args: {
    onClick: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof GenericVPNCard>;

// ============================================================================
// Stories
// ============================================================================

/**
 * An active L2TP client that is currently connected.
 */
export const L2TPConnected: Story = {
  name: 'L2TP — Connected',
  args: {
    vpnInterface: {
      id: 'l2tp-out1',
      name: 'l2tp-out1',
      type: 'l2tp',
      disabled: false,
      running: true,
      connectTo: 'vpn.example.com',
      user: 'admin',
      comment: 'Primary office VPN',
    },
  },
};

/**
 * An L2TP client that is configured but not currently running.
 */
export const L2TPDisconnected: Story = {
  name: 'L2TP — Disconnected',
  args: {
    vpnInterface: {
      id: 'l2tp-out2',
      name: 'l2tp-out2',
      type: 'l2tp',
      disabled: false,
      running: false,
      connectTo: '10.0.0.1',
      user: 'remote-user',
    },
  },
};

/**
 * A disabled PPTP interface — no status indicator shows "Disabled".
 */
export const PPTPDisabled: Story = {
  name: 'PPTP — Disabled',
  args: {
    vpnInterface: {
      id: 'pptp-out1',
      name: 'pptp-out1',
      type: 'pptp',
      disabled: true,
      running: false,
      connectTo: 'pptp.provider.net',
      user: 'pptp_user',
      comment: 'Legacy PPTP — kept for compatibility',
    },
  },
};

/**
 * An active SSTP client with certificate verification enabled.
 * The card shows the "Verify Certificate" field when that property is present.
 */
export const SSTPWithCertVerification: Story = {
  name: 'SSTP — Certificate Verification',
  args: {
    vpnInterface: {
      id: 'sstp-out1',
      name: 'sstp-out1',
      type: 'sstp',
      disabled: false,
      running: true,
      connectTo: 'sstp.secure-corp.com',
      user: 'corp_user',
      verifyServerCertificate: true,
      comment: 'Corporate SSTP with cert pinning',
    },
  },
};

/**
 * Minimal interface with only the required fields — no user, comment, or
 * certificate fields are shown.
 */
export const MinimalInterface: Story = {
  name: 'Minimal — Required Fields Only',
  args: {
    vpnInterface: {
      id: 'l2tp-min',
      name: 'l2tp-minimal',
      type: 'l2tp',
      disabled: false,
      running: false,
      connectTo: '192.168.1.254',
    },
  },
};

/**
 * Clickable card variant — the card receives hover, focus, and keyboard
 * interaction styles when an onClick handler is provided.
 */
export const ClickableCard: Story = {
  name: 'Clickable — Interactive Mode',
  args: {
    vpnInterface: {
      id: 'l2tp-click',
      name: 'l2tp-office',
      type: 'l2tp',
      disabled: false,
      running: true,
      connectTo: 'vpn.office.example.com',
      user: 'alice',
      comment: 'Click to open detail panel',
    },
    onClick: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'When onClick is provided the card renders as role="button" with hover shadow, ' +
          'keyboard Enter/Space activation, and a focus ring. Try tabbing to the card and pressing Enter.',
      },
    },
  },
};
