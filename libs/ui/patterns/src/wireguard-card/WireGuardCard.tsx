/**
 * WireGuard Card Component
 * Displays WireGuard interface with name, status, port, public key, and peer count
 * Expandable to show peer details with Framer Motion animation
 *
 * @see NAS-4.23 - Refactored to use useClipboard hook
 */

import { memo, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, ChevronDown } from 'lucide-react';

import { useWireGuardPeers } from '@nasnet/api-client/queries';
import type { WireGuardInterface } from '@nasnet/core/types';
import { formatPublicKey, formatBytes, formatLastHandshake } from '@nasnet/core/utils';
import { useConnectionStore } from '@nasnet/state/stores';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  Skeleton,
  cn,
} from '@nasnet/ui/primitives';

import { useClipboard } from '../hooks';
import { useToast } from '../hooks/useToast';
import { StatusIndicator } from '../status-indicator';
import { PeerListItem } from './PeerListItem';

/**
 * WireGuardCard Props
 */
export interface WireGuardCardProps {
  /** WireGuard interface data */
  interface: WireGuardInterface;
  /** Peer count for this interface */
  peerCount?: number;
  /** Optional click handler for card interaction */
  onClick?: () => void;
}

/**
 * WireGuardCard Component
 * Shows WireGuard interface name, listening port, status, public key with copy button, and peer count
 * Expandable to show peer details
 */
function WireGuardCardComponent({
  interface: wgInterface,
  peerCount = 0,
  onClick,
}: WireGuardCardProps) {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';

  // Use shared clipboard hook with standardized 2000ms timeout (NAS-4.23)
  const { copy, copied } = useClipboard({
    onSuccess: () => {
      toast({
        title: 'Public key copied',
        description: 'The full public key has been copied to clipboard',
      });
    },
    onError: () => {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy public key to clipboard',
        variant: 'destructive',
      });
    },
  });

  // Fetch peers when expanded (lazy loading)
  const {
    data: peers,
    isLoading: isLoadingPeers,
    isError: isPeersError,
  } = useWireGuardPeers(routerIp, isExpanded ? wgInterface.name : undefined);

  /**
   * Handle copy public key to clipboard
   */
  const handleCopyPublicKey = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent card click if card has onClick
      copy(wgInterface.publicKey);
    },
    [copy, wgInterface.publicKey]
  );

  /**
   * Handle toggle expansion
   */
  const handleToggleExpand = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click if card has onClick
    setIsExpanded((prev) => !prev);
  }, []);

  // Determine status for display
  const status =
    wgInterface.isDisabled ? 'offline'
    : wgInterface.isRunning ? 'online'
    : 'warning';

  const statusLabel =
    wgInterface.isDisabled ? 'Disabled'
    : wgInterface.isRunning ? 'Active'
    : 'Inactive';

  return (
    <Card
      className={cn(
        'rounded-[var(--semantic-radius-card)] shadow-[var(--semantic-shadow-card)] transition-shadow duration-200 hover:shadow-lg'
      )}
    >
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
                className="bg-secondary text-secondary-foreground rounded-[var(--semantic-radius-badge)]"
              >
                {peerCount} {peerCount === 1 ? 'peer' : 'peers'}
              </Badge>
            )}
            {/* Chevron indicator for expandable state */}
            {peerCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleExpand}
                className="hover:bg-muted h-8 w-8 rounded-[var(--semantic-radius-button)] p-1 transition-colors duration-150"
              >
                <ChevronDown
                  className={`text-muted-foreground h-5 w-5 transition-transform duration-200 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-component-lg pt-0">
        <div className="divide-border space-y-0 divide-y">
          <div className="flex items-center justify-between py-3">
            <span className="text-muted-foreground text-sm font-medium">Port</span>
            <span className="text-foreground font-mono text-sm font-semibold">
              {wgInterface.listenPort}
            </span>
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
          <div className="pt-component-lg space-y-component-md">
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
                    {formatLastHandshake(wgInterface.lastHandshake)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Public Key with Copy Button */}
        <div className="pt-component-lg border-border border-t">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="text-muted-foreground mb-2 block text-xs font-medium">
                Public Key
              </span>
              <code className="bg-muted text-foreground block truncate rounded-[var(--semantic-radius-button)] px-3 py-2 font-mono text-xs">
                {formatPublicKey(wgInterface.publicKey)}
              </code>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyPublicKey}
              className="flex-shrink-0 rounded-[var(--semantic-radius-button)]"
            >
              {copied ?
                <>
                  <Check className="text-success mr-1 h-4 w-4" />
                  Copied
                </>
              : <>
                  <Copy className="mr-1 h-4 w-4" />
                  Copy
                </>
              }
            </Button>
          </div>
        </div>

        {/* Animated Peers Section */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-component-lg border-border space-y-component-lg border-t">
                <h4 className="text-foreground text-sm font-semibold">Connected Peers</h4>

                {/* Loading state */}
                {isLoadingPeers && (
                  <div className="space-y-component-md">
                    <Skeleton className="h-32 w-full rounded-[var(--semantic-radius-card)]" />
                    <Skeleton className="h-32 w-full rounded-[var(--semantic-radius-card)]" />
                  </div>
                )}

                {/* Error state */}
                {isPeersError && (
                  <div className="text-error-dark dark:text-error bg-error-light/50 dark:bg-error/10 px-component-lg py-component-md border-l-error rounded-[var(--semantic-radius-input)] border-l-4 text-sm">
                    Failed to load peers for this interface
                  </div>
                )}

                {/* Peers list */}
                {!isLoadingPeers && !isPeersError && peers && peers.length > 0 && (
                  <div className="space-y-component-md">
                    {peers.map((peer) => (
                      <PeerListItem
                        key={peer.id}
                        peer={peer}
                      />
                    ))}
                  </div>
                )}

                {/* Empty state */}
                {!isLoadingPeers && !isPeersError && peers && peers.length === 0 && (
                  <div className="text-muted-foreground bg-muted rounded-[var(--semantic-radius-card)] py-6 text-center text-sm italic">
                    No peers configured for this interface
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

/**
 * WireGuardCard - Memoized component for performance
 */
export const WireGuardCard = memo(WireGuardCardComponent);
WireGuardCard.displayName = 'WireGuardCard';
