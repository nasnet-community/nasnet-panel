/**
 * WireGuardCard Storybook Stories
 *
 * Demonstrates the WireGuardCard pattern for WireGuard VPN interface display.
 * The real component integrates with Apollo (useWireGuardPeers) and Zustand
 * (useConnectionStore), so stories use a mock wrapper that isolates the
 * visual presentation without requiring live store/network bindings.
 *
 * @module @nasnet/ui/patterns/wireguard-card
 */

import * as React from 'react';

import type { WireGuardInterface, WireGuardPeer } from '@nasnet/core/types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  Skeleton,
} from '@nasnet/ui/primitives';

import { StatusIndicator } from '../status-indicator';
import { PeerListItem } from './PeerListItem';

import type { Meta, StoryObj } from '@storybook/react';

// ============================================================================
// Mock helpers
// ============================================================================

const MOCK_PEER_1: WireGuardPeer = {
  id: 'peer-1',
  interface: 'wg0',
  publicKey: 'XHGJ7kLrP8mN3qT2vB5cF9eA4dI6wY1sO0uZpMnKjR=',
  allowedAddress: ['10.100.0.2/32', '192.168.10.0/24'],
  endpoint: '203.0.113.10:51820',
  lastHandshake: new Date(Date.now() - 45 * 1000), // 45 seconds ago
  rx: 52_428_800, // 50 MB
  tx: 10_485_760, // 10 MB
};

const MOCK_PEER_2: WireGuardPeer = {
  id: 'peer-2',
  interface: 'wg0',
  publicKey: 'aB3cD4eF5gH6iJ7kL8mN9oP0qR1sT2uV3wX4yZ5aB=',
  allowedAddress: ['10.100.0.3/32'],
  endpoint: '198.51.100.22:51820',
  lastHandshake: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
  rx: 1_048_576, // 1 MB
  tx: 524_288, // 512 KB
};

// ============================================================================
// Visual mock component
//
// WireGuardCard depends on Apollo (useWireGuardPeers) and Zustand
// (useConnectionStore). Rather than requiring providers, we recreate the card's
// visual structure with controlled state so every story is deterministic.
// ============================================================================

interface MockWireGuardCardProps {
  /** WireGuard interface data */
  wgInterface: WireGuardInterface;
  /** Peer count badge value */
  peerCount?: number;
  /** Peers to display when expanded */
  peers?: WireGuardPeer[];
  /** Whether to start expanded */
  defaultExpanded?: boolean;
  /** Simulate peers loading */
  peersLoading?: boolean;
  /** Simulate peers error */
  peersError?: boolean;
}

function MockWireGuardCard({
  wgInterface,
  peerCount = 0,
  peers = [],
  defaultExpanded = false,
  peersLoading = false,
  peersError = false,
}: MockWireGuardCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
  const [copied, setCopied] = React.useState(false);

  const status =
    wgInterface.isDisabled ? 'offline'
    : wgInterface.isRunning ? 'online'
    : 'warning';

  const statusLabel =
    wgInterface.isDisabled ? 'Disabled'
    : wgInterface.isRunning ? 'Active'
    : 'Inactive';

  // Truncate public key for display: first 8 chars + ellipsis + last 4 chars
  const displayKey =
    wgInterface.publicKey.length > 12 ?
      `${wgInterface.publicKey.slice(0, 8)}...${wgInterface.publicKey.slice(-4)}`
    : wgInterface.publicKey;

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
    if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
    if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(1)} KB`;
    return `${bytes} B`;
  };

  const formatHandshake = (date?: Date): string => {
    if (!date) return 'Never';
    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    return `${Math.floor(diffSec / 3600)}h ago`;
  };

  return (
    <Card className="rounded-card-sm md:rounded-card-lg shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <CardTitle className="text-foreground text-lg font-semibold">
              {wgInterface.name}
            </CardTitle>
            <StatusIndicator
              status={status}
              label={statusLabel}
              className="mt-2"
            />
          </div>
          <div className="flex items-center gap-2">
            {peerCount > 0 && (
              <Badge
                variant="secondary"
                className="rounded-full"
              >
                {peerCount} {peerCount === 1 ? 'peer' : 'peers'}
              </Badge>
            )}
            {peerCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="rounded-button h-8 w-8 p-1"
                aria-label={isExpanded ? 'Collapse peers' : 'Expand peers'}
              >
                <span
                  className={`text-muted-foreground inline-block transition-transform duration-200 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                >
                  ▼
                </span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        <div className="divide-border space-y-0 divide-y">
          <div className="flex items-center justify-between py-3">
            <span className="text-muted-foreground text-sm font-medium">Port</span>
            <span className="text-foreground text-sm font-semibold">{wgInterface.listenPort}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-muted-foreground text-sm font-medium">MTU</span>
            <span className="text-foreground text-sm font-semibold">{wgInterface.mtu}</span>
          </div>
        </div>

        {/* Connection Stats */}
        {(wgInterface.rx !== undefined ||
          wgInterface.tx !== undefined ||
          wgInterface.lastHandshake) && (
          <div className="space-y-3 pt-4">
            <div className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
              Connection Stats
            </div>
            <div className="divide-border space-y-0 divide-y">
              {wgInterface.rx !== undefined && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground text-sm font-medium">Received</span>
                  <span className="text-foreground font-mono text-sm font-semibold">
                    {formatBytes(wgInterface.rx)}
                  </span>
                </div>
              )}
              {wgInterface.tx !== undefined && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground text-sm font-medium">Transmitted</span>
                  <span className="text-foreground font-mono text-sm font-semibold">
                    {formatBytes(wgInterface.tx)}
                  </span>
                </div>
              )}
              {wgInterface.lastHandshake && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground text-sm font-medium">Last Handshake</span>
                  <span className="text-foreground text-sm font-semibold">
                    {formatHandshake(wgInterface.lastHandshake)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Public Key */}
        <div className="border-border border-t pt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="text-muted-foreground mb-2 block text-xs font-medium">
                Public Key
              </span>
              <code className="bg-muted rounded-button text-foreground block truncate px-3 py-2 font-mono text-xs">
                {displayKey}
              </code>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="rounded-button flex-shrink-0 gap-1"
            >
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>

        {/* Expandable Peers Section */}
        {isExpanded && (
          <div className="border-border space-y-4 border-t pt-4">
            <h4 className="text-foreground text-sm font-semibold">Connected Peers</h4>

            {peersLoading && (
              <div className="space-y-3">
                <Skeleton className="rounded-card-sm h-32 w-full" />
                <Skeleton className="rounded-card-sm h-32 w-full" />
              </div>
            )}

            {peersError && (
              <div className="text-destructive bg-destructive/10 rounded-card-sm px-4 py-3 text-sm">
                Failed to load peers for this interface
              </div>
            )}

            {!peersLoading && !peersError && peers.length > 0 && (
              <div className="space-y-3">
                {peers.map((peer) => (
                  <PeerListItem
                    key={peer.id}
                    peer={peer}
                  />
                ))}
              </div>
            )}

            {!peersLoading && !peersError && peers.length === 0 && (
              <div className="text-muted-foreground bg-muted/50 rounded-card-sm py-6 text-center text-sm italic">
                No peers configured for this interface
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof MockWireGuardCard> = {
  title: 'Patterns/VPN/WireGuardCard',
  component: MockWireGuardCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A card component for displaying WireGuard VPN interface status, configuration,
and connected peers.

## Features
- Status indicator (Active / Inactive / Disabled)
- Listen port and MTU display
- Connection stats (RX / TX / Last Handshake) when available
- Truncated public key with one-click clipboard copy
- Expandable peer list with lazy loading (mocked in Storybook)
- Peer count badge

## Note
The real \`WireGuardCard\` component fetches peer data via Apollo
(\`useWireGuardPeers\`) and reads router IP from Zustand (\`useConnectionStore\`).
These stories use a visual mock wrapper so no network or store setup is required.
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[400px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MockWireGuardCard>;

// ============================================================================
// Stories
// ============================================================================

/**
 * An active WireGuard server interface with 2 peers.
 */
export const ActiveWithPeers: Story = {
  name: 'Active — With Peers',
  args: {
    wgInterface: {
      id: 'wg0',
      name: 'wg0',
      isRunning: true,
      isDisabled: false,
      listenPort: 13231,
      mtu: 1420,
      publicKey: 'XHGJ7kLrP8mN3qT2vB5cF9eA4dI6wY1sO0uZpMnKjR=',
      rx: 104_857_600, // 100 MB
      tx: 20_971_520, // 20 MB
      lastHandshake: new Date(Date.now() - 90 * 1000), // 90 seconds ago
    },
    peerCount: 2,
    peers: [MOCK_PEER_1, MOCK_PEER_2],
    defaultExpanded: false,
  },
};

/**
 * Active server with the peer list pre-expanded.
 */
export const ExpandedWithPeers: Story = {
  name: 'Active — Peers Expanded',
  args: {
    wgInterface: {
      id: 'wg0',
      name: 'wg0',
      isRunning: true,
      isDisabled: false,
      listenPort: 13231,
      mtu: 1420,
      publicKey: 'XHGJ7kLrP8mN3qT2vB5cF9eA4dI6wY1sO0uZpMnKjR=',
      rx: 104_857_600,
      tx: 20_971_520,
      lastHandshake: new Date(Date.now() - 90 * 1000),
    },
    peerCount: 2,
    peers: [MOCK_PEER_1, MOCK_PEER_2],
    defaultExpanded: true,
  },
};

/**
 * An inactive interface — configured but not currently running.
 */
export const Inactive: Story = {
  name: 'Inactive — Not Running',
  args: {
    wgInterface: {
      id: 'wg1',
      name: 'wg1',
      isRunning: false,
      isDisabled: false,
      listenPort: 51820,
      mtu: 1420,
      publicKey: 'aB3cD4eF5gH6iJ7kL8mN9oP0qR1sT2uV3wX4yZ5aB=',
    },
    peerCount: 0,
  },
};

/**
 * A disabled interface — administratively shut down.
 */
export const Disabled: Story = {
  name: 'Disabled',
  args: {
    wgInterface: {
      id: 'wg2',
      name: 'wg-backup',
      isRunning: false,
      isDisabled: true,
      listenPort: 51820,
      mtu: 1420,
      publicKey: 'zZ9yY8xX7wW6vV5uU4tT3sS2rR1qQ0pP9oO8nN7mM=',
    },
    peerCount: 1,
    peers: [MOCK_PEER_1],
  },
};

/**
 * Active interface showing all connection statistics.
 */
export const WithConnectionStats: Story = {
  name: 'With Connection Stats',
  args: {
    wgInterface: {
      id: 'wg0',
      name: 'wg0',
      isRunning: true,
      isDisabled: false,
      listenPort: 13231,
      mtu: 1420,
      publicKey: 'XHGJ7kLrP8mN3qT2vB5cF9eA4dI6wY1sO0uZpMnKjR=',
      rx: 5_368_709_120, // 5 GB
      tx: 1_073_741_824, // 1 GB
      lastHandshake: new Date(Date.now() - 30 * 1000), // 30 seconds ago
    },
    peerCount: 0,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows the Connection Stats section when rx, tx, or lastHandshake data is available.',
      },
    },
  },
};

/**
 * Expanded peer list in loading state — simulates lazy-fetch in progress.
 */
export const PeersLoading: Story = {
  name: 'Peers Loading',
  args: {
    wgInterface: {
      id: 'wg0',
      name: 'wg0',
      isRunning: true,
      isDisabled: false,
      listenPort: 13231,
      mtu: 1420,
      publicKey: 'XHGJ7kLrP8mN3qT2vB5cF9eA4dI6wY1sO0uZpMnKjR=',
    },
    peerCount: 3,
    peers: [],
    defaultExpanded: true,
    peersLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Skeleton placeholders appear while peer data is being fetched from the router.',
      },
    },
  },
};

/**
 * Expanded peer list in error state — simulates network failure.
 */
export const PeersError: Story = {
  name: 'Peers Error',
  args: {
    wgInterface: {
      id: 'wg0',
      name: 'wg0',
      isRunning: true,
      isDisabled: false,
      listenPort: 13231,
      mtu: 1420,
      publicKey: 'XHGJ7kLrP8mN3qT2vB5cF9eA4dI6wY1sO0uZpMnKjR=',
    },
    peerCount: 2,
    peers: [],
    defaultExpanded: true,
    peersError: true,
  },
};
